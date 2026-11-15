import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { Pool, types, type PoolClient } from "pg";
import { z } from "zod";
import { graphEnabled, graphQuery } from "./graph";

types.setTypeParser(20, Number);
export class CommonsError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export type Principal = {
  id: string;
  workspaceId: string;
  projectId: string | null;
  kind: "owner" | "agent";
  name: string;
  email: string | null;
  createdAt: number;
  lastSeen: number;
  revokedAt: number | null;
  removedAt: number | null;
};
export type Participant = Omit<Principal, "email">;
export type Project = {
  version: number;
  id: string;
  workspaceId: string;
  name: string;
  brief: string;
  createdAt: number;
};
export type NoteInput = {
  title: string;
  body: string;
  references?: { label: string; url: string }[];
};
export type Note = {
  version: number;
  editedAt: number | null;
  id: string;
  projectId: string;
  workspaceId: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  referenceLinks: { label: string; url: string }[];
  createdAt: number;
  read: boolean;
};
export type ProjectFile = { id: string; workspaceId: string; projectId: string; authorId: string; authorName: string; name: string; size: number; mimeType: string; checksum: string; objectKey: string; ready: boolean; createdAt: number };
const fileSelect = "SELECT f.*,p.name AS author_name FROM project_files f JOIN participants p ON p.id=f.author_id";
export type PageKind = "page" | "folder" | "collection";
export type PageStatus = "Idea" | "Drafting" | "Ready";
export type PageInput = {
  kind?: PageKind;
  status?: PageStatus;
  title: string;
  body: string;
  parentId: string | null;
};
export type WorkspacePage = PageInput & {
  kind: PageKind;
  status: PageStatus;
  id: string;
  projectId: string;
  workspaceId: string;
  authorId: string;
  authorName: string;
  version: number;
  createdAt: number;
  editedAt: number | null;
};
export type PageTreeItem = Pick<WorkspacePage, "id" | "projectId" | "parentId" | "title" | "kind" | "status" | "authorId">;
export type PageComment = { id: string; pageId: string; projectId: string; authorId: string; authorName: string; body: string; createdAt: number };
const pageSchema = z.object({
  kind: z.enum(["page", "folder", "collection"]).optional(),
  status: z.enum(["Idea", "Drafting", "Ready"]).optional(),
  title: z.string().trim().min(1, "Give the page a title.").max(160),
  body: z.string().max(100000),
  parentId: z.uuid().nullable(),
});
const pageSelect =
  "SELECT d.*,p.name AS author_name FROM pages d JOIN participants p ON p.id=d.author_id";
export type SearchResult = {
  id: string;
  kind: "note" | "project" | "agent" | "page" | "file";
  title: string;
  description: string;
  href: string;
};
export type Activity = {
  id: number;
  projectId: string;
  authorName: string;
  description: string;
  resourceId: string;
  createdAt: number;
};
const idSchema = z.uuid();
const nameSchema = z
  .string()
  .trim()
  .min(2, "Use at least two characters.")
  .max(60);
const textSchema = z.string().trim().min(1, "Leave some context.").max(12000);
const titleSchema = z.string().trim().min(1, "Add a clear title.").max(160);
const noteSchema = z.object({
  title: titleSchema,
  body: textSchema,
  references: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(120),
        url: z
          .url()
          .max(2048)
          .refine(
            (url) => ["https:", "http:"].includes(new URL(url).protocol),
            "Use an HTTP or HTTPS reference.",
          ),
      }),
    )
    .max(10)
    .optional(),
});
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const camel = (row: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
      value,
    ]),
  );
const noteSelect =
  "SELECT n.*,p.name AS author_name,EXISTS(SELECT 1 FROM reads r WHERE r.note_id=n.id AND r.participant_id=$1 AND r.read_at>=coalesce(n.edited_at,n.created_at)) AS read FROM notes n JOIN participants p ON p.id=n.author_id";
export class Store {
  constructor(
    private pool: Pool,
    private secret: string,
    private clock = Date.now,
    private connection: Pool | PoolClient = pool,
  ) {}
  private async rows<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return (await this.connection.query(sql, params)).rows.map(camel) as T[];
  }
  private async one<T>(sql: string, params: unknown[] = []) {
    return (await this.rows<T>(sql, params))[0];
  }
  private async transaction<T>(operation: (store: Store) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await operation(
        new Store(this.pool, this.secret, this.clock, client),
      );
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  private hash(value: string) {
    return createHmac("sha256", this.secret).update(value).digest("hex");
  }
  private async rateLimit(key: string, limit: number, window = 60000) {
    const now = this.clock();
    const row = await this.one<{ count: number }>(
      `INSERT INTO rate_limits(key,count,resets_at) VALUES($1,1,$2)
      ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.resets_at<=$3 THEN 1 ELSE rate_limits.count+1 END,
      resets_at=CASE WHEN rate_limits.resets_at<=$3 THEN $2 ELSE rate_limits.resets_at END RETURNING count`,
      [key, now + window, now],
    );
    if (row.count > limit)
      throw new CommonsError(
        "Too many attempts. Wait a minute and try again.",
        429,
      );
  }
  private async active(id: string) {
    const actor = await this.one<Principal>(
      "SELECT * FROM participants WHERE id=$1 AND revoked_at IS NULL AND removed_at IS NULL",
      [idSchema.parse(id)],
    );
    if (!actor)
      throw new CommonsError(
        "This session no longer has access. Ask the owner for a new invitation.",
        401,
      );
    return actor;
  }
  private async owner(actor: Principal) {
    const current = await this.active(actor.id);
    if (current.kind !== "owner")
      throw new CommonsError("Only the workspace owner can do that.", 403);
    return current;
  }
  private async record(
    actor: Principal,
    projectId: string,
    description: string,
    resourceId: string,
  ) {
    await this.connection.query(
      "INSERT INTO activity(project_id,author_id,description,resource_id,created_at) VALUES($1,$2,$3,$4,$5)",
      [projectId, actor.id, description, resourceId, this.clock()],
    );
  }
  private async session(actorId: string, label: string, days: number) {
    const token = randomBytes(32).toString("base64url");
    await this.connection.query(
      "INSERT INTO sessions(token_hash,participant_id,label,expires_at) VALUES($1,$2,$3,$4)",
      [digest(token), actorId, label, this.clock() + days * 86400000],
    );
    return token;
  }
  async createLocalOwner(emailInput: string, nameInput: string) {
    const email = z.email().parse(emailInput.toLowerCase().trim()),
      name = nameSchema.parse(nameInput);
    return this.transaction(async (tx) => {
      await tx.connection.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        email,
      ]);
      let actor = await tx.one<Principal>(
        "SELECT * FROM participants WHERE email=$1 AND kind='owner'",
        [email],
      );
      if (!actor) {
        const workspaceId = randomUUID(),
          id = randomUUID(),
          now = this.clock();
        await tx.connection.query("INSERT INTO workspaces VALUES($1,$2,$3)", [
          workspaceId,
          `${name.trim().split(/\s+/)[0]}’s workspace`,
          now,
        ]);
        await tx.connection.query(
          "INSERT INTO participants(id,workspace_id,kind,name,email,created_at,last_seen) VALUES($1,$2,'owner',$3,$4,$5,$5)",
          [id, workspaceId, name, email, now],
        );
        actor = await tx.active(id);
      }
      return { token: await tx.session(actor.id, "Browser", 30), actor };
    });
  }
  async beginGoogleSignIn(state: string, verifier: string, nonce: string) {
    await this.rateLimit("google-login", 300);
    await this.connection.query(
      "DELETE FROM oauth_flows WHERE expires_at<=$1",
      [this.clock()],
    );
    await this.connection.query("INSERT INTO oauth_flows VALUES($1,$2,$3,$4)", [
      digest(state),
      verifier,
      nonce,
      this.clock() + 600000,
    ]);
  }
  async consumeGoogleSignIn(state: string) {
    const flow = await this.one<{ verifier: string; nonce: string }>(
      "DELETE FROM oauth_flows WHERE state_hash=$1 AND expires_at>$2 RETURNING verifier,nonce",
      [digest(state), this.clock()],
    );
    if (!flow)
      throw new CommonsError("Sign-in expired. Please try again.", 401);
    return flow;
  }
  async signInGoogle(
    subjectInput: string,
    emailInput: string,
    nameInput: string,
  ) {
    const subject = z.string().min(1).max(255).parse(subjectInput);
    const email = z.email().parse(emailInput.trim().toLowerCase());
    const name = nameSchema.parse(nameInput.trim().slice(0, 60));
    return this.transaction(async (tx) => {
      await tx.connection.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        "google:" + subject,
      ]);
      await tx.connection.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        email,
      ]);
      const identity = await tx.one<{ participantId: string }>(
        "SELECT participant_id FROM google_identities WHERE subject=$1",
        [subject],
      );
      if (identity) {
        const actor = await tx.active(identity.participantId);
        return { actor, token: await tx.session(actor.id, "Google", 30) };
      }
      let actor = await tx.one<Principal>(
        "SELECT * FROM participants WHERE email=$1 AND kind='owner'",
        [email],
      );
      if (actor) {
        const linked = await tx.one(
          "SELECT 1 FROM google_identities WHERE participant_id=$1",
          [actor.id],
        );
        if (
          linked ||
          email !== process.env.COMMONS_OWNER_EMAIL?.trim().toLowerCase()
        )
          throw new CommonsError(
            "This email is already associated with another identity.",
            403,
          );
        actor = await tx.active(actor.id);
      } else {
        const workspaceId = randomUUID(),
          id = randomUUID(),
          now = this.clock();
        await tx.connection.query("INSERT INTO workspaces VALUES($1,$2,$3)", [
          workspaceId,
          `${name.trim().split(/\s+/)[0]}’s workspace`,
          now,
        ]);
        await tx.connection.query(
          "INSERT INTO participants(id,workspace_id,kind,name,email,created_at,last_seen) VALUES($1,$2,'owner',$3,$4,$5,$5)",
          [id, workspaceId, name, email, now],
        );
        actor = await tx.active(id);
      }
      await tx.connection.query("INSERT INTO google_identities VALUES($1,$2)", [
        subject,
        actor.id,
      ]);
      return { actor, token: await tx.session(actor.id, "Google", 30) };
    });
  }
  async signInTestOwner(
    key: string,
    expectedHash: string,
    email: string,
    name: string,
  ) {
    await this.rateLimit("test-owner-login", 10);
    if (
      !/^[a-f0-9]{64}$/.test(expectedHash) ||
      key.length > 200 ||
      !timingSafeEqual(Buffer.from(digest(key)), Buffer.from(expectedHash))
    )
      throw new CommonsError("That testing access key is not valid.", 401);
    return this.createLocalOwner(email, name);
  }
  async resumeAgent(token: string) {
    const actor = await this.authenticate(token);
    if (actor.kind !== "agent")
      throw new CommonsError("Use an agent credential to return.", 403);
    await this.rateLimit(`resume:${actor.id}`, 10);
    return { actor, token: await this.session(actor.id, "Browser", 90) };
  }
  async authenticate(token: string) {
    const session = await this.one<{ participantId: string }>(
      "SELECT participant_id FROM sessions WHERE token_hash=$1 AND expires_at>$2",
      [digest(token), this.clock()],
    );
    if (!session)
      throw new CommonsError(
        "Your session has ended. Sign in or join again.",
        401,
      );
    const actor = await this.active(session.participantId);
    if (actor.kind === "agent") {
      await this.connection.query(
        "UPDATE sessions SET expires_at=$1 WHERE token_hash=$2 AND expires_at<$3",
        [
          this.clock() + 90 * 86400000,
          digest(token),
          this.clock() + 89 * 86400000,
        ],
      );
    }
    await this.connection.query(
      "UPDATE participants SET last_seen=$1 WHERE id=$2",
      [this.clock(), actor.id],
    );
    return actor;
  }
  async signOut(token: string) {
    await this.connection.query("DELETE FROM sessions WHERE token_hash=$1", [
      digest(token),
    ]);
  }
  async createCredential(actor: Principal, label: string) {
    const current = await this.active(actor.id);
    if (current.kind !== "agent")
      throw new CommonsError(
        "MCP credentials belong to an agent registration.",
        403,
      );
    await this.rateLimit(`credential:${current.id}`, 10);
    return this.session(current.id, nameSchema.parse(label), 90);
  }
  async getWorkspace(actor: Principal) {
    const current = await this.active(actor.id);
    return this.one<{ id: string; name: string }>(
      "SELECT id,name FROM workspaces WHERE id=$1",
      [current.workspaceId],
    );
  }
  async renameWorkspace(actor: Principal, name: string) {
    const current = await this.owner(actor);
    await this.connection.query("UPDATE workspaces SET name=$1 WHERE id=$2", [
      nameSchema.parse(name),
      current.workspaceId,
    ]);
  }
  async listProjects(actor: Principal) {
    const current = await this.active(actor.id);
    return this.rows<Project>(
      "SELECT * FROM projects WHERE workspace_id=$1 AND ($2::uuid IS NULL OR id=$2) ORDER BY created_at,id",
      [current.workspaceId, current.projectId],
    );
  }
  async getProject(actor: Principal, id: string) {
    const current = await this.active(actor.id);
    const project = await this.one<Project>(
      "SELECT * FROM projects WHERE id=$1 AND workspace_id=$2 AND ($3::uuid IS NULL OR id=$3)",
      [idSchema.parse(id), current.workspaceId, current.projectId],
    );
    if (!project)
      throw new CommonsError("This project is outside your access.", 403);
    return project;
  }
  async createProject(actor: Principal, name: string, brief: string) {
    const current = await this.owner(actor),
      id = randomUUID();
    const project = await this.one<Project>(
      "INSERT INTO projects(id,workspace_id,name,brief,created_at) VALUES($1,$2,$3,$4,$5) RETURNING *",
      [
        id,
        current.workspaceId,
        nameSchema.parse(name),
        z.string().trim().max(12000).parse(brief),
        this.clock(),
      ],
    );
    await this.record(current, id, "Created the project", id);
    return project;
  }
  async listParticipants(
    actor: Principal,
    projectId?: string,
    includeRevoked = false,
  ) {
    const current = await this.active(actor.id);
    if (projectId) await this.getProject(current, projectId);
    if (includeRevoked) await this.owner(current);
    const scope = projectId || current.projectId;
    return this.rows<Participant>(
      `SELECT id,workspace_id,project_id,kind,name,created_at,last_seen,revoked_at,removed_at FROM participants WHERE workspace_id=$1
      AND ($2::uuid IS NULL OR project_id IS NULL OR project_id=$2) AND removed_at IS NULL AND ($3 OR revoked_at IS NULL) ORDER BY created_at,id`,
      [current.workspaceId, scope, includeRevoked],
    );
  }
  async issueInvite(actor: Principal, projectId: string | null) {
    const current = await this.owner(actor);
    if (projectId) await this.getProject(current, projectId);
    await this.rateLimit(`invite:${current.id}`, 30);
    const id = randomUUID(),
      code = String(randomInt(1000000)).padStart(6, "0"),
      expiresAt = this.clock() + 600000;
    await this.connection.query(
      "INSERT INTO invitations(id,workspace_id,project_id,code_hash,expires_at) VALUES($1,$2,$3,$4,$5)",
      [
        id,
        current.workspaceId,
        projectId,
        this.hash(`${id}:${code}`),
        expiresAt,
      ],
    );
    return { id, code, expiresAt, projectId };
  }
  async getInvitation(id: string) {
    return this.one<{
      workspaceName: string;
      projectName: string | null;
      expiresAt: number;
    }>(
      "SELECT w.name AS workspace_name,p.name AS project_name,i.expires_at FROM invitations i JOIN workspaces w ON w.id=i.workspace_id LEFT JOIN projects p ON p.id=i.project_id WHERE i.id=$1 AND i.consumed_at IS NULL AND i.expires_at>$2",
      [idSchema.parse(id), this.clock()],
    );
  }
  async join(id: string, code: string, name: string) {
    idSchema.parse(id);
    const agentName = nameSchema.parse(name);
    z.string()
      .regex(/^\d{6}$/, "Enter the six-digit connection code.")
      .parse(code);
    await this.rateLimit(`join:${this.hash(id)}`, 10);
    return this.transaction(async (tx) => {
      const invite = await tx.one<{
        workspaceId: string;
        projectId: string | null;
        codeHash: string;
      }>(
        "SELECT * FROM invitations WHERE id=$1 AND consumed_at IS NULL AND expires_at>$2 FOR UPDATE",
        [id, this.clock()],
      );
      const actual = this.hash(`${id}:${code}`);
      if (
        !invite ||
        !timingSafeEqual(Buffer.from(actual), Buffer.from(invite.codeHash))
      )
        throw new CommonsError(
          "This code is invalid, expired or already used. Ask for a new invitation.",
        );
      const agentId = randomUUID(),
        now = this.clock();
      await tx.connection.query(
        "UPDATE invitations SET consumed_at=$1 WHERE id=$2",
        [now, id],
      );
      await tx.connection.query(
        "INSERT INTO participants(id,workspace_id,project_id,kind,name,created_at,last_seen) VALUES($1,$2,$3,'agent',$4,$5,$5)",
        [agentId, invite.workspaceId, invite.projectId, agentName, now],
      );
      const actor = await tx.active(agentId);
      if (invite.projectId)
        await tx.record(actor, invite.projectId, "Joined the project", agentId);
      return { token: await tx.session(agentId, "Agent", 90), actor };
    });
  }
  async revoke(actor: Principal, participantId: string) {
    const owner = await this.owner(actor);
    await this.transaction(async (tx) => {
      const target = await tx.one<Principal>(
        "SELECT * FROM participants WHERE id=$1 AND workspace_id=$2 AND kind='agent' FOR UPDATE",
        [idSchema.parse(participantId), owner.workspaceId],
      );
      if (!target)
        throw new CommonsError("This agent is outside your workspace.", 403);
      await tx.connection.query(
        "UPDATE participants SET revoked_at=$1 WHERE id=$2",
        [this.clock(), target.id],
      );
      await tx.connection.query(
        "DELETE FROM sessions WHERE participant_id=$1",
        [target.id],
      );
    });
  }
  async createNote(
    actor: Principal,
    projectId: string,
    input: NoteInput,
    clientKey: string,
  ) {
    const current = await this.active(actor.id),
      project = await this.getProject(current, projectId),
      data = noteSchema.parse(input);
    idSchema.parse(clientKey);
    await this.rateLimit(`write:${current.id}`, 120);
    return this.transaction(async (tx) => {
      await tx.connection.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        "note:" + current.id + clientKey,
      ]);
      const prior = await tx.one<{ id: string; projectId: string }>(
        "SELECT id,project_id FROM notes WHERE author_id=$1 AND client_key=$2",
        [current.id, clientKey],
      );
      if (prior) {
        if (prior.projectId !== projectId)
          throw new CommonsError(
            "That save identifier belongs to another project.",
          );
        return tx.getNote(current, prior.id);
      }
      const row = await tx.one<{ id: string }>(
        `INSERT INTO notes(id,workspace_id,project_id,author_id,title,body,reference_links,client_key,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT(author_id,client_key) DO UPDATE SET client_key=EXCLUDED.client_key RETURNING id`,
        [
          randomUUID(),
          project.workspaceId,
          project.id,
          current.id,
          data.title,
          data.body,
          JSON.stringify(data.references || []),
          clientKey,
          this.clock(),
        ],
      );
      await tx.record(current, projectId, "Shared a note", row.id);
      return tx.getNote(current, row.id);
    });
  }
  async getNote(actor: Principal, id: string) {
    const current = await this.active(actor.id);
    const note = await this.one<Note>(
      `${noteSelect} WHERE n.id=$2 AND n.workspace_id=$3 AND ($4::uuid IS NULL OR n.project_id=$4)`,
      [current.id, idSchema.parse(id), current.workspaceId, current.projectId],
    );
    if (!note) throw new CommonsError("This note is outside your access.", 403);
    return note;
  }
  async listNotes(
    actor: Principal,
    projectId: string,
    options: { query?: string; unread?: boolean; offset?: number } = {},
  ) {
    await this.getProject(actor, projectId);
    const offset = z
      .number()
      .int()
      .min(0)
      .max(1000000)
      .parse(options.offset || 0);
    const query = z
      .string()
      .max(200)
      .parse(options.query || "");
    const notes = await this.rows<Note>(
      `${noteSelect} WHERE n.project_id=$2 AND (n.title ILIKE $3 OR n.body ILIKE $3)
      AND (NOT $4 OR NOT EXISTS(SELECT 1 FROM reads d WHERE d.note_id=n.id AND d.participant_id=$1 AND d.read_at>=coalesce(n.edited_at,n.created_at))) ORDER BY n.created_at DESC,n.id DESC LIMIT 51 OFFSET $5`,
      [actor.id, projectId, `%${query}%`, !!options.unread, offset],
    );
    return {
      notes: notes.slice(0, 50),
      nextOffset: notes.length > 50 ? offset + 50 : null,
    };
  }
  async markRead(actor: Principal, noteId: string) {
    await this.getNote(actor, noteId);
    await this.connection.query(
      "INSERT INTO reads VALUES($1,$2,$3) ON CONFLICT(participant_id,note_id) DO UPDATE SET read_at=EXCLUDED.read_at",
      [actor.id, noteId, this.clock()],
    );
  }
  async updateProject(
    actor: Principal,
    projectId: string,
    name: string,
    brief: string,
    version: number,
  ) {
    return this.transaction(async (tx) => {
      const current = await tx.owner(actor);
      await tx.getProject(current, projectId);
      const changed = await tx.connection.query(
        "UPDATE projects SET name=$1,brief=$2,version=version+1 WHERE id=$3 AND version=$4",
        [
          nameSchema.parse(name),
          z.string().trim().max(12000).parse(brief),
          projectId,
          z.number().int().positive().parse(version),
        ],
      );
      if (!changed.rowCount)
        throw new CommonsError(
          "This project changed. Reload before saving your changes.",
          409,
        );
      await tx.record(current, projectId, "Updated the project", projectId);
      return tx.getProject(current, projectId);
    });
  }
  async updateNote(
    actor: Principal,
    noteId: string,
    input: NoteInput,
    version: number,
  ) {
    return this.transaction(async (tx) => {
      const current = await tx.active(actor.id),
        note = await tx.getNote(current, noteId);
      if (current.kind !== "owner" && note.authorId !== current.id)
        throw new CommonsError(
          "Only the author or workspace owner can edit this note.",
          403,
        );
      const data = noteSchema.parse(input);
      const changed = await tx.connection.query(
        "UPDATE notes SET title=$1,body=$2,reference_links=$3,edited_at=$4,version=version+1 WHERE id=$5 AND version=$6",
        [
          data.title,
          data.body,
          JSON.stringify(data.references || []),
          this.clock(),
          noteId,
          z.number().int().positive().parse(version),
        ],
      );
      if (!changed.rowCount)
        throw new CommonsError(
          "This note changed. Reload before saving your changes.",
          409,
        );
      await tx.connection.query("DELETE FROM reads WHERE note_id=$1", [noteId]);
      await tx.record(current, note.projectId, "Edited a note", noteId);
      return tx.getNote(current, noteId);
    });
  }
  async deleteNote(actor: Principal, noteId: string, version: number) {
    return this.transaction(async (tx) => {
      const current = await tx.active(actor.id),
        note = await tx.getNote(current, noteId);
      if (current.kind !== "owner" && note.authorId !== current.id)
        throw new CommonsError(
          "Only the author or workspace owner can delete this note.",
          403,
        );
      await tx.connection.query("SELECT id FROM notes WHERE id=$1 FOR UPDATE", [
        noteId,
      ]);
      await tx.connection.query("DELETE FROM reads WHERE note_id=$1", [noteId]);
      const changed = await tx.connection.query(
        "DELETE FROM notes WHERE id=$1 AND version=$2",
        [noteId, z.number().int().positive().parse(version)],
      );
      if (!changed.rowCount)
        throw new CommonsError(
          "This note changed. Reload before deleting it.",
          409,
        );
      await tx.record(current, note.projectId, "Deleted a note", noteId);
      return { projectId: note.projectId };
    });
  }
  private async eraseProject(projectId: string) {
    await this.connection.query(
      "SELECT id FROM projects WHERE id=$1 FOR UPDATE",
      [projectId],
    );
    await this.connection.query(
      "DELETE FROM sessions WHERE participant_id IN (SELECT id FROM participants WHERE project_id=$1)",
      [projectId],
    );
    await this.connection.query(
      "UPDATE participants SET revoked_at=coalesce(revoked_at,$2),removed_at=$2,project_id=NULL WHERE project_id=$1",
      [projectId, this.clock()],
    );
    await this.connection.query("DELETE FROM invitations WHERE project_id=$1", [
      projectId,
    ]);
    await this.connection.query(
      "DELETE FROM reads WHERE note_id IN (SELECT id FROM notes WHERE project_id=$1)",
      [projectId],
    );
    await this.connection.query("DELETE FROM notes WHERE project_id=$1", [
      projectId,
    ]);
    await this.connection.query("DELETE FROM activity WHERE project_id=$1", [
      projectId,
    ]);
    await this.connection.query("DELETE FROM projects WHERE id=$1", [
      projectId,
    ]);
  }
  async deleteProject(
    actor: Principal,
    projectId: string,
    confirmation: string,
  ) {
    return this.transaction(async (tx) => {
      const current = await tx.owner(actor);
      await tx.connection.query(
        "SELECT id FROM projects WHERE id=$1 AND workspace_id=$2 FOR UPDATE",
        [projectId, current.workspaceId],
      );
      const project = await tx.getProject(current, projectId);
      if (confirmation !== project.name)
        throw new CommonsError("Type the project name to confirm deletion.");
      await tx.eraseProject(projectId);
    });
  }
  async updateProfile(actor: Principal, name: string) {
    const current = await this.active(actor.id);
    await this.connection.query("UPDATE participants SET name=$1 WHERE id=$2", [
      nameSchema.parse(name),
      current.id,
    ]);
  }
  async updateAgent(
    actor: Principal,
    participantId: string,
    name: string,
    projectId: string | null,
  ) {
    return this.transaction(async (tx) => {
      const current = await tx.owner(actor);
      if (projectId) await tx.getProject(current, projectId);
      const changed = await tx.connection.query(
        "UPDATE participants SET name=$1,project_id=$2 WHERE id=$3 AND workspace_id=$4 AND kind='agent' AND revoked_at IS NULL AND removed_at IS NULL",
        [
          nameSchema.parse(name),
          projectId,
          idSchema.parse(participantId),
          current.workspaceId,
        ],
      );
      if (!changed.rowCount)
        throw new CommonsError(
          "This agent is no longer active in your workspace.",
          403,
        );
    });
  }
  async removeAgent(actor: Principal, participantId: string) {
    return this.transaction(async (tx) => {
      const current = await tx.owner(actor);
      const changed = await tx.connection.query(
        "UPDATE participants SET removed_at=$1,revoked_at=coalesce(revoked_at,$1) WHERE id=$2 AND workspace_id=$3 AND kind='agent'",
        [this.clock(), idSchema.parse(participantId), current.workspaceId],
      );
      if (!changed.rowCount)
        throw new CommonsError("This agent is outside your workspace.", 403);
      await tx.connection.query(
        "DELETE FROM sessions WHERE participant_id=$1",
        [participantId],
      );
    });
  }
  async listInvitations(actor: Principal) {
    const current = await this.owner(actor);
    return this.rows<{
      id: string;
      projectId: string | null;
      expiresAt: number;
    }>(
      "SELECT id,project_id,expires_at FROM invitations WHERE workspace_id=$1 AND consumed_at IS NULL AND expires_at>$2 ORDER BY expires_at DESC",
      [current.workspaceId, this.clock()],
    );
  }
  async cancelInvitation(actor: Principal, invitationId: string) {
    const current = await this.owner(actor);
    await this.connection.query(
      "DELETE FROM invitations WHERE id=$1 AND workspace_id=$2 AND consumed_at IS NULL",
      [idSchema.parse(invitationId), current.workspaceId],
    );
  }
  async listSessions(
    actor: Principal,
    currentToken: string,
    participantId = actor.id,
  ) {
    const current = await this.active(actor.id);
    if (participantId !== current.id) {
      await this.owner(current);
      const target = await this.one(
        "SELECT id FROM participants WHERE id=$1 AND workspace_id=$2 AND removed_at IS NULL",
        [idSchema.parse(participantId), current.workspaceId],
      );
      if (!target)
        throw new CommonsError(
          "This connection is outside your workspace.",
          403,
        );
    }
    return this.rows<{
      id: string;
      label: string;
      createdAt: number;
      expiresAt: number;
      current: boolean;
    }>(
      "SELECT id,label,created_at,expires_at,token_hash=$2 AS current FROM sessions WHERE participant_id=$1 AND expires_at>$3 ORDER BY created_at DESC,id",
      [participantId, digest(currentToken), this.clock()],
    );
  }
  async revokeSession(actor: Principal, sessionId: string) {
    const current = await this.active(actor.id);
    await this.connection.query(
      "DELETE FROM sessions s USING participants p WHERE s.id=$1 AND p.id=s.participant_id AND p.workspace_id=$2 AND (p.id=$3 OR $4='owner')",
      [
        idSchema.parse(sessionId),
        current.workspaceId,
        current.id,
        current.kind,
      ],
    );
  }
  async signOutOthers(actor: Principal, currentToken: string) {
    const current = await this.active(actor.id);
    await this.connection.query(
      "DELETE FROM sessions WHERE participant_id=$1 AND token_hash<>$2",
      [current.id, digest(currentToken)],
    );
  }
  async workspaceCounts(actor: Principal) {
    const current = await this.owner(actor);
    return this.one<{ projects: number; notes: number; agents: number }>(
      "SELECT (SELECT count(*) FROM projects WHERE workspace_id=$1) projects,(SELECT count(*) FROM notes WHERE workspace_id=$1) notes,(SELECT count(*) FROM participants WHERE workspace_id=$1 AND kind='agent' AND removed_at IS NULL) agents",
      [current.workspaceId],
    );
  }
  async deleteWorkspace(
    actor: Principal,
    confirmation: string,
    deleteAccount = false,
  ) {
    return this.transaction(async (tx) => {
      const current = await tx.owner(actor),
        workspace = await tx.getWorkspace(current);
      if (confirmation !== (deleteAccount ? "DELETE" : workspace.name))
        throw new CommonsError("The confirmation does not match.");
      await tx.connection.query(
        "SELECT id FROM workspaces WHERE id=$1 FOR UPDATE",
        [current.workspaceId],
      );
      const projects = await tx.listProjects(current);
      for (const project of projects) await tx.eraseProject(project.id);
      await tx.connection.query(
        "DELETE FROM invitations WHERE workspace_id=$1",
        [current.workspaceId],
      );
      await tx.connection.query(
        "DELETE FROM sessions WHERE participant_id IN (SELECT id FROM participants WHERE workspace_id=$1 AND (kind='agent' OR $2))",
        [current.workspaceId, deleteAccount],
      );
      await tx.connection.query(
        "DELETE FROM reads WHERE participant_id IN (SELECT id FROM participants WHERE workspace_id=$1)",
        [current.workspaceId],
      );
      if (deleteAccount)
        await tx.connection.query(
          "DELETE FROM google_identities WHERE participant_id=$1",
          [current.id],
        );
      await tx.connection.query(
        "DELETE FROM participants WHERE workspace_id=$1 AND (kind='agent' OR $2)",
        [current.workspaceId, deleteAccount],
      );
      if (!deleteAccount) {
        const next = randomUUID();
        await tx.connection.query("INSERT INTO workspaces VALUES($1,$2,$3)", [
          next,
          `${current.name.split(/\s+/)[0]}’s workspace`,
          this.clock(),
        ]);
        await tx.connection.query(
          "UPDATE participants SET workspace_id=$1 WHERE id=$2",
          [next, current.id],
        );
      }
      await tx.connection.query("DELETE FROM workspaces WHERE id=$1", [
        current.workspaceId,
      ]);
    });
  }
  async inspectGraph(actor: Principal, projectId: string) {
    await this.owner(actor);
    await this.getProject(actor, projectId);
    const sync = await this.one<{
      revision: number;
      syncedRevision: number;
      syncedAt: string | null;
      lastError: string | null;
    }>("SELECT * FROM graph_sync WHERE project_id=$1", [projectId]);
    const nodes = await this.rows<{
      id: number;
      resourceId: string;
      kind: string;
      title: string;
      revoked: boolean;
    }>(
      `SELECT g.id,g.resource_id,g.kind,coalesce(n.title,d.title,f.name,p.name,pr.name) title,coalesce(p.revoked_at IS NOT NULL,false) revoked
       FROM graph_entities g LEFT JOIN notes n ON g.kind='note' AND n.id=g.resource_id
       LEFT JOIN participants p ON g.kind='participant' AND p.id=g.resource_id
       LEFT JOIN pages d ON g.kind='page' AND d.id=g.resource_id
       LEFT JOIN project_files f ON g.kind='file' AND f.id=g.resource_id AND f.ready
       LEFT JOIN projects pr ON g.kind='project' AND pr.id=g.resource_id
       WHERE g.project_id=$1 AND (n.id IS NOT NULL OR d.id IS NOT NULL OR f.id IS NOT NULL OR p.id IS NOT NULL OR pr.id IS NOT NULL) ORDER BY g.kind,g.id LIMIT 200`,
      [projectId],
    );
    const edges: { source: number; target: number; kind: string }[] = [];
    let available = graphEnabled();
    if (available && sync?.revision === sync?.syncedRevision && nodes.length) {
      try {
        const allowed = new Set(nodes.map((n) => n.id));
        for (const kind of ["IN_PROJECT", "AUTHORED_BY", "IN_PAGE", "REFERENCES"]) {
          const result = await graphQuery(
            `MATCH (a)-[:${kind}]->(b) WHERE a.id IN $ids RETURN a.id,b.id LIMIT 1000`,
            { ids: [...allowed] },
          );
          for (const row of result.rows) {
            const source = Number(row[0]?.value),
              target = Number(row[1]?.value);
            if (allowed.has(source) && allowed.has(target))
              edges.push({ source, target, kind });
          }
        }
      } catch {
        available = false;
        edges.length = 0;
      }
    }
    await this.owner(actor);
    return { nodes, edges, available, sync };
  }
  async listFiles(actor: Principal, projectId: string, options: { query?: string; offset?: number } = {}) {
    await this.getProject(actor, projectId);
    const offset = z.number().int().min(0).max(1000000).parse(options.offset || 0);
    const query = z.string().max(200).parse(options.query || "");
    const files = await this.rows<ProjectFile>(`${fileSelect} WHERE f.project_id=$1 AND f.ready AND f.name ILIKE $2 ORDER BY f.created_at DESC,f.id DESC LIMIT 51 OFFSET $3`, [projectId, `%${query}%`, offset]);
    return { files: files.slice(0, 50), nextOffset: files.length > 50 ? offset + 50 : null };
  }
  async getFile(actor: Principal, fileId: string, includePending = false) {
    const file = await this.one<ProjectFile>(`${fileSelect} WHERE f.id=$1 AND (f.ready OR $2)`, [idSchema.parse(fileId), includePending]);
    if (!file) throw new CommonsError("This file is unavailable.", 404);
    await this.getProject(actor, file.projectId);
    return file;
  }
  async reserveFile(actor: Principal, projectId: string, input: { name: string; size: number; mimeType: string; checksum: string }) {
    return this.transaction(async (tx) => {
      const current = await tx.active(actor.id);
      await tx.getProject(current, projectId);
      await tx.rateLimit(`upload:${current.id}`, 30);
      const data = z.object({ name: z.string().trim().min(1).max(240).refine((v) => !/[\x00-\x1f\x7f/\\]/.test(v), "Use a file name without control characters or path separators."), size: z.number().int().min(0).max(16777216, "Each file can be up to 16 MB."), mimeType: z.string().min(1).max(120), checksum: z.string().regex(/^[a-f0-9]{64}$/) }).parse(input);
      await tx.connection.query("SELECT id FROM workspaces WHERE id=$1 FOR UPDATE", [current.workspaceId]);
      const usage = await tx.one<{ bytes: number }>("SELECT coalesce(sum(size),0)::bigint bytes FROM project_files WHERE workspace_id=$1", [current.workspaceId]);
      if (usage.bytes + data.size > 1073741824) throw new CommonsError("This workspace has reached its 1 GB storage limit. Remove unused files before uploading more.", 413);
      const prefix = process.env.R2_PREFIX || "commons-files/";
      if (!/^[a-zA-Z0-9/-]+\/$/.test(prefix)) throw new Error("Configure a valid private R2 prefix.");
      const id = randomUUID(), key = `${prefix}${current.workspaceId}/${id}`;
      await tx.connection.query("INSERT INTO project_files(id,workspace_id,project_id,author_id,name,mime_type,size,checksum,object_key,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)", [id, current.workspaceId, projectId, current.id, data.name, data.mimeType, data.size, data.checksum, key, this.clock()]);
      return tx.getFile(current, id, true);
    });
  }
  async completeFile(actor: Principal, fileId: string) {
    return this.transaction(async (tx) => {
      const current = await tx.active(actor.id), file = await tx.getFile(current, fileId, true);
      if (file.authorId !== current.id) throw new CommonsError("Only the uploader can finish this upload.", 403);
      const changed = await tx.connection.query("UPDATE project_files SET ready=true WHERE id=$1 AND NOT ready", [fileId]);
      if (changed.rowCount) await tx.record(current, file.projectId, "Uploaded a file", fileId);
      return tx.getFile(current, fileId);
    });
  }
  async deleteFile(actor: Principal, fileId: string) {
    return this.transaction(async (tx) => {
      const current = await tx.active(actor.id), file = await tx.getFile(current, fileId, true);
      if (current.kind !== "owner" && current.id !== file.authorId) throw new CommonsError("Only the uploader or workspace owner can delete this file.", 403);
      await tx.connection.query("DELETE FROM project_files WHERE id=$1", [fileId]);
      if (file.ready) await tx.record(current, file.projectId, "Deleted a file", fileId);
      return { projectId: file.projectId };
    });
  }
  async queueFileCleanup(objectKey: string) {
    await this.connection.query("INSERT INTO file_cleanup(object_key) VALUES($1) ON CONFLICT DO NOTHING", [objectKey]);
  }
  async pageTree(actor: Principal, projectId: string) {
    await this.getProject(actor, projectId);
    return this.rows<PageTreeItem>("SELECT id,project_id,parent_id,title,kind,status,author_id FROM pages WHERE project_id=$1 ORDER BY created_at,id", [projectId]);
  }
  async listComments(actor: Principal, pageId: string, offset = 0) {
    await this.getPage(actor, pageId);
    const comments = await this.rows<PageComment>("SELECT c.*,p.name AS author_name FROM page_comments c JOIN participants p ON p.id=c.author_id WHERE c.page_id=$1 ORDER BY c.created_at,c.id LIMIT 51 OFFSET $2", [pageId, z.number().int().min(0).max(1000000).parse(offset)]);
    return { comments: comments.slice(0, 50), nextOffset: comments.length > 50 ? offset + 50 : null };
  }
  async createComment(actor: Principal, pageId: string, body: string, clientKey: string) {
    return this.transaction(async tx => {
      const current = await tx.active(actor.id), page = await tx.getPage(current, pageId);
      const text = z.string().trim().min(1, "Write a comment first.").max(10000).parse(body);
      idSchema.parse(clientKey);
      await tx.connection.query("SELECT id FROM pages WHERE id=$1 FOR UPDATE", [pageId]);
      await tx.connection.query("SELECT pg_advisory_xact_lock(hashtext($1))", ["comment:" + current.id + clientKey]);
      const prior = await tx.one<PageComment>("SELECT c.*,p.name AS author_name FROM page_comments c JOIN participants p ON p.id=c.author_id WHERE c.author_id=$1 AND c.client_key=$2", [current.id, clientKey]);
      if (prior) {
        if (prior.pageId !== pageId) throw new CommonsError("This save key belongs to another page.", 409);
        return prior;
      }
      const id = randomUUID(), createdAt = this.clock();
      await tx.connection.query("INSERT INTO page_comments(id,page_id,project_id,workspace_id,author_id,body,client_key,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)", [id, pageId, page.projectId, page.workspaceId, current.id, text, clientKey, createdAt]);
      await tx.record(current, page.projectId, "Commented on a page", pageId);
      return { id, pageId, projectId: page.projectId, authorId: current.id, authorName: current.name, body: text, createdAt };
    });
  }
  async deleteComment(actor: Principal, commentId: string) {
    return this.transaction(async tx => {
      const current = await tx.active(actor.id);
      const comment = await tx.one<PageComment>("SELECT * FROM page_comments WHERE id=$1 FOR UPDATE", [idSchema.parse(commentId)]);
      if (!comment) throw new CommonsError("This comment is unavailable.", 404);
      await tx.getPage(current, comment.pageId);
      if (current.kind !== "owner" && current.id !== comment.authorId) throw new CommonsError("Only the author or workspace owner can delete this comment.", 403);
      await tx.connection.query("DELETE FROM page_comments WHERE id=$1", [commentId]);
      await tx.record(current, comment.projectId, "Deleted a page comment", comment.pageId);
      return { pageId: comment.pageId, projectId: comment.projectId };
    });
  }
  async listPages(
    actor: Principal,
    projectId: string,
    options: { query?: string; offset?: number; parentId?: string | null } = {},
  ) {
    await this.getProject(actor, projectId);
    const offset = z
      .number()
      .int()
      .min(0)
      .max(1000000)
      .parse(options.offset || 0);
    const query = z
      .string()
      .max(200)
      .parse(options.query || "");
    const pages = await this.rows<WorkspacePage>(
      `${pageSelect} WHERE d.project_id=$1 AND (d.title ILIKE $2 OR d.body ILIKE $2) AND ($4::boolean = false OR d.parent_id IS NOT DISTINCT FROM $5::uuid) ORDER BY d.created_at DESC,d.id DESC LIMIT 51 OFFSET $3`,
      [projectId, `%${query}%`, offset, options.parentId !== undefined, options.parentId === undefined ? null : z.uuid().nullable().parse(options.parentId)],
    );
    return {
      pages: pages.slice(0, 50),
      nextOffset: pages.length > 50 ? offset + 50 : null,
    };
  }
  async getPage(actor: Principal, pageId: string) {
    const page = await this.one<WorkspacePage>(`${pageSelect} WHERE d.id=$1`, [
      idSchema.parse(pageId),
    ]);
    if (!page) throw new CommonsError("This page is unavailable.", 404);
    await this.getProject(actor, page.projectId);
    return page;
  }
  private async pageParent(
    actor: Principal,
    projectId: string,
    parentId: string | null,
    pageId?: string,
  ) {
    if (!parentId) return;
    const parent = await this.getPage(actor, parentId);
    if (parent.projectId !== projectId)
      throw new CommonsError("Choose a parent page in this project.");
    if (pageId) {
      const cycle = await this.one(
        "WITH RECURSIVE ancestors AS (SELECT id,parent_id FROM pages WHERE id=$1 UNION SELECT p.id,p.parent_id FROM pages p JOIN ancestors a ON p.id=a.parent_id) SELECT 1 FROM ancestors WHERE id=$2",
        [parentId, pageId],
      );
      if (cycle)
        throw new CommonsError(
          "A page cannot be placed inside itself or its children.",
        );
    }
  }
  async createPage(
    actor: Principal,
    projectId: string,
    input: PageInput,
    clientKey: string = randomUUID(),
  ) {
    return this.transaction(async (tx) => {
      const current = await tx.active(actor.id);
      await tx.getProject(current, projectId);
      const data = pageSchema.parse(input);
      await tx.connection.query(
        "SELECT id FROM projects WHERE id=$1 FOR UPDATE",
        [projectId],
      );
      await tx.connection.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        "page:" + current.id + idSchema.parse(clientKey),
      ]);
      const prior = await tx.one<{ id: string }>(
        "SELECT id FROM pages WHERE author_id=$1 AND client_key=$2",
        [current.id, clientKey],
      );
      if (prior) {
        const page = await tx.getPage(current, prior.id);
        if (page.projectId !== projectId)
          throw new CommonsError(
            "This save key belongs to another project.",
            409,
          );
        return page;
      }
      await tx.pageParent(current, projectId, data.parentId);
      const id = randomUUID();
      await tx.connection.query(
        "INSERT INTO pages(id,workspace_id,project_id,author_id,parent_id,title,body,client_key,created_at,kind,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
        [
          id,
          current.workspaceId,
          projectId,
          current.id,
          data.parentId,
          data.title,
          data.body,
          clientKey,
          this.clock(),
          data.kind || "page",
          data.status || "Idea",
        ],
      );
      await tx.record(current, projectId, "Created a page", id);
      return tx.getPage(current, id);
    });
  }
  async updatePage(
    actor: Principal,
    pageId: string,
    input: PageInput,
    version: number,
  ) {
    return this.transaction(async (tx) => {
      const current = await tx.active(actor.id),
        page = await tx.getPage(current, pageId);
      if (current.kind !== "owner" && page.authorId !== current.id)
        throw new CommonsError(
          "Only the author or workspace owner can edit this page.",
          403,
        );
      const data = pageSchema.parse(input);
      await tx.connection.query(
        "SELECT id FROM projects WHERE id=$1 FOR UPDATE",
        [page.projectId],
      );
      await tx.pageParent(current, page.projectId, data.parentId, pageId);
      const changed = await tx.connection.query(
        "UPDATE pages SET title=$1,body=$2,parent_id=$3,edited_at=$4,version=version+1,kind=$7,status=$8 WHERE id=$5 AND version=$6",
        [
          data.title,
          data.body,
          data.parentId,
          this.clock(),
          pageId,
          z.number().int().positive().parse(version),
          data.kind ?? page.kind,
          data.status ?? page.status,
        ],
      );
      if (!changed.rowCount)
        throw new CommonsError(
          "This page changed since you opened it. Your draft is kept below. Open the latest page in another tab to compare before saving.",
          409,
        );
      await tx.record(current, page.projectId, "Updated a page", page.id);
      return tx.getPage(current, pageId);
    });
  }
  async deletePage(actor: Principal, pageId: string, version: number) {
    return this.transaction(async (tx) => {
      const current = await tx.active(actor.id),
        page = await tx.getPage(current, pageId);
      if (current.kind !== "owner" && page.authorId !== current.id)
        throw new CommonsError(
          "Only the author or workspace owner can delete this page.",
          403,
        );
      await tx.connection.query(
        "SELECT id FROM projects WHERE id=$1 FOR UPDATE",
        [page.projectId],
      );
      const changed = await tx.connection.query(
        "DELETE FROM pages WHERE id=$1 AND version=$2",
        [pageId, z.number().int().positive().parse(version)],
      );
      if (!changed.rowCount)
        throw new CommonsError(
          "This page changed. Open the latest version before deleting it.",
          409,
        );
      await tx.record(current, page.projectId, "Deleted a page", pageId);
      return { projectId: page.projectId };
    });
  }
  async searchProject(
    actor: Principal,
    projectId: string,
    input: string,
  ): Promise<SearchResult[]> {
    const query = z.string().trim().max(200).parse(input);
    const project = await this.getProject(actor, projectId);
    const [notes, people, pages, files] = await Promise.all([
      this.listNotes(actor, projectId, { query }),
      this.listParticipants(actor, projectId),
      this.listPages(actor, projectId, { query }),
      this.listFiles(actor, projectId, { query }),
    ]);
    const base = `/workspace/projects/${projectId}`;
    const results: SearchResult[] = [];
    const matches = (text: string) =>
      text.toLowerCase().includes(query.toLowerCase());
    if (query && matches(project.name + " " + project.brief))
      results.push({
        id: project.id,
        kind: "project",
        title: project.name,
        description: "Project brief",
        href: base,
      });
    results.push(
      ...pages.pages
        .slice(0, 8)
        .map((page) => ({
          id: page.id,
          kind: "page" as const,
          title: page.title,
          description: `Page by ${page.authorName}`,
          href: `${base}/pages/${page.id}`,
        })),
    );
    results.push(
      ...notes.notes.slice(0, 8).map((note) => ({
        id: note.id,
        kind: "note" as const,
        title: note.title,
        description: `Note by ${note.authorName}`,
        href: `${base}?note=${note.id}`,
      })),
    );
    results.push(...files.files.slice(0, 6).map((file) => ({ id: file.id, kind: "file" as const, title: file.name, description: `File by ${file.authorName}`, href: `${base}/files?file=${file.id}` })));
    if (query)
      results.push(
        ...people
          .filter((person) => person.kind === "agent" && matches(person.name))
          .slice(0, 4)
          .map((person) => ({
            id: person.id,
            kind: "agent" as const,
            title: person.name,
            description: person.projectId
              ? "Project access"
              : "Workspace access",
            href: `/workspace/agents#agent-${person.id}`,
          })),
      );
    return results;
  }

  async recentActivity(actor: Principal, projectId: string) {
    await this.getProject(actor, projectId);
    return this.rows<Activity>("SELECT a.*,p.name AS author_name FROM activity a JOIN participants p ON p.id=a.author_id WHERE a.project_id=$1 ORDER BY a.id DESC LIMIT 5", [projectId]);
  }
  async activity(actor: Principal, projectId: string, after = 0) {
    await this.getProject(actor, projectId);
    return this.rows<Activity>(
      "SELECT a.*,p.name AS author_name FROM activity a JOIN participants p ON p.id=a.author_id WHERE a.project_id=$1 AND a.id>$2 ORDER BY a.id ASC LIMIT 50",
      [projectId, z.number().int().min(0).parse(after)],
    );
  }
}
