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
};
export type Participant = Omit<Principal, "email">;
export type Project = {
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
export type RequestInput = {
  title: string;
  body: string;
  recipientIds: string[];
  noteId?: string;
};
export type DirectedRequest = {
  id: string;
  projectId: string;
  workspaceId: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  noteId: string | null;
  resultNoteId: string | null;
  createdAt: number;
  completedAt: number | null;
  status: "open" | "in_progress" | "done";
  recipients: {
    id: string;
    name: string;
    acknowledgedAt: number | null;
    revokedAt: number | null;
  }[];
};
export type SearchResult = {
  id: string;
  kind: "note" | "request" | "project" | "agent";
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
const requestSchema = z.object({
  title: titleSchema,
  body: textSchema,
  recipientIds: z.array(idSchema).min(1, "Choose an agent.").max(20),
  noteId: idSchema.optional(),
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
  "SELECT n.*,p.name AS author_name,EXISTS(SELECT 1 FROM reads r WHERE r.note_id=n.id AND r.participant_id=$1) AS read FROM notes n JOIN participants p ON p.id=n.author_id";
const requestSelect = `SELECT r.*,p.name AS author_name,
  CASE WHEN r.completed_at IS NOT NULL THEN 'done' WHEN EXISTS(SELECT 1 FROM recipients t WHERE t.request_id=r.id AND t.acknowledged_at IS NOT NULL) THEN 'in_progress' ELSE 'open' END AS status,
  COALESCE((SELECT jsonb_agg(jsonb_build_object('id',a.id,'name',a.name,'acknowledgedAt',t.acknowledged_at,'revokedAt',a.revoked_at) ORDER BY a.created_at,a.id) FROM recipients t JOIN participants a ON a.id=t.participant_id WHERE t.request_id=r.id),'[]') AS recipients
  FROM requests r JOIN participants p ON p.id=r.author_id`;

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
      "SELECT * FROM participants WHERE id=$1 AND revoked_at IS NULL",
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
    await this.connection.query("INSERT INTO sessions VALUES($1,$2,$3,$4)", [
      digest(token),
      actorId,
      label,
      this.clock() + days * 86400000,
    ]);
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
          `${name}’s workspace`,
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
      "INSERT INTO projects VALUES($1,$2,$3,$4,$5) RETURNING *",
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
  async updateBrief(actor: Principal, projectId: string, brief: string) {
    await this.owner(actor);
    await this.getProject(actor, projectId);
    await this.connection.query("UPDATE projects SET brief=$1 WHERE id=$2", [
      z.string().trim().max(12000).parse(brief),
      projectId,
    ]);
    await this.record(actor, projectId, "Updated the project brief", projectId);
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
      `SELECT id,workspace_id,project_id,kind,name,created_at,last_seen,revoked_at FROM participants WHERE workspace_id=$1
      AND ($2::uuid IS NULL OR project_id IS NULL OR project_id=$2) AND ($3 OR revoked_at IS NULL) ORDER BY created_at,id`,
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
      AND (NOT $4 OR NOT EXISTS(SELECT 1 FROM reads d WHERE d.note_id=n.id AND d.participant_id=$1)) ORDER BY n.created_at DESC,n.id DESC LIMIT 51 OFFSET $5`,
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
  async createRequest(
    actor: Principal,
    projectId: string,
    input: RequestInput,
    clientKey: string,
  ) {
    const current = await this.active(actor.id),
      project = await this.getProject(current, projectId),
      data = requestSchema.parse(input);
    idSchema.parse(clientKey);
    await this.rateLimit(`write:${current.id}`, 120);
    return this.transaction(async (tx) => {
      const prior = await tx.one<{ id: string; projectId: string }>(
        "SELECT id,project_id FROM requests WHERE author_id=$1 AND client_key=$2",
        [current.id, clientKey],
      );
      if (prior) {
        if (prior.projectId !== projectId)
          throw new CommonsError(
            "That save identifier belongs to another project.",
          );
        return tx.getRequest(current, prior.id);
      }
      const eligible = await tx.listParticipants(current, projectId);
      const recipientIds = [...new Set(data.recipientIds)];
      if (
        recipientIds.some(
          (id) => !eligible.some((p) => p.id === id && p.kind === "agent"),
        )
      )
        throw new CommonsError(
          "Choose agents who currently have access to this project.",
          403,
        );
      if (
        data.noteId &&
        (await tx.getNote(current, data.noteId)).projectId !== projectId
      )
        throw new CommonsError("Attach a note from this project.", 403);
      await tx.connection.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        current.id + clientKey,
      ]);
      const existing = await tx.one<{ id: string }>(
        "SELECT id FROM requests WHERE author_id=$1 AND client_key=$2",
        [current.id, clientKey],
      );
      if (existing) return tx.getRequest(current, existing.id);
      const id = randomUUID();
      await tx.connection.query(
        "INSERT INTO requests(id,workspace_id,project_id,author_id,title,body,note_id,client_key,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [
          id,
          project.workspaceId,
          projectId,
          current.id,
          data.title,
          data.body,
          data.noteId || null,
          clientKey,
          this.clock(),
        ],
      );
      for (const recipient of recipientIds)
        await tx.connection.query(
          "INSERT INTO recipients(request_id,participant_id,project_id,workspace_id) VALUES($1,$2,$3,$4)",
          [id, recipient, projectId, project.workspaceId],
        );
      await tx.record(current, projectId, "Created a request", id);
      return tx.getRequest(current, id);
    });
  }
  async getRequest(actor: Principal, id: string) {
    const current = await this.active(actor.id);
    const request = await this.one<DirectedRequest>(
      `${requestSelect} WHERE r.id=$1 AND r.workspace_id=$2 AND ($3::uuid IS NULL OR r.project_id=$3)`,
      [idSchema.parse(id), current.workspaceId, current.projectId],
    );
    if (!request)
      throw new CommonsError("This request is outside your access.", 403);
    return request;
  }
  async listRequests(
    actor: Principal,
    projectId: string,
    options: { mine?: boolean; query?: string; offset?: number } = {},
  ) {
    await this.getProject(actor, projectId);
    const offset = z
      .number()
      .int()
      .min(0)
      .max(1000000)
      .parse(options.offset || 0);
    const requests = await this.rows<DirectedRequest>(
      `${requestSelect} WHERE r.project_id=$1 AND (NOT $2 OR EXISTS(SELECT 1 FROM recipients t WHERE t.request_id=r.id AND t.participant_id=$3))
      AND (r.title ILIKE $4 OR r.body ILIKE $4) ORDER BY r.created_at DESC,r.id DESC LIMIT 51 OFFSET $5`,
      [
        projectId,
        !!options.mine,
        actor.id,
        `%${z
          .string()
          .max(200)
          .parse(options.query || "")}%`,
        offset,
      ],
    );
    return {
      requests: requests.slice(0, 50),
      nextOffset: requests.length > 50 ? offset + 50 : null,
    };
  }
  async acknowledge(actor: Principal, id: string) {
    const request = await this.getRequest(actor, id);
    if (
      !request.recipients.some((r) => r.id === actor.id && r.revokedAt === null)
    )
      throw new CommonsError(
        "Only a named recipient can acknowledge this request.",
        403,
      );
    if (request.completedAt)
      throw new CommonsError("This request is already complete.");
    const changed = await this.connection.query(
      "UPDATE recipients SET acknowledged_at=$1 WHERE request_id=$2 AND participant_id=$3 AND acknowledged_at IS NULL",
      [this.clock(), id, actor.id],
    );
    if (changed.rowCount)
      await this.record(actor, request.projectId, "Acknowledged a request", id);
    return this.getRequest(actor, id);
  }
  async completeRequest(actor: Principal, id: string, resultNoteId?: string) {
    const current = await this.active(actor.id),
      request = await this.getRequest(current, id);
    const recipient = request.recipients.find((r) => r.id === current.id);
    if (current.kind !== "owner" && (!recipient || !recipient.acknowledgedAt))
      throw new CommonsError(
        "A named recipient must acknowledge the request before completing it.",
        403,
      );
    if (
      resultNoteId &&
      (await this.getNote(current, resultNoteId)).projectId !==
        request.projectId
    )
      throw new CommonsError(
        "The result note must belong to this project.",
        403,
      );
    const changed = await this.connection.query(
      "UPDATE requests SET completed_at=$1,result_note_id=$2 WHERE id=$3 AND completed_at IS NULL",
      [this.clock(), resultNoteId || null, id],
    );
    if (changed.rowCount)
      await this.record(current, request.projectId, "Completed a request", id);
    return this.getRequest(current, id);
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
      `SELECT g.id,g.resource_id,g.kind,coalesce(n.title,r.title,p.name,pr.name) title,coalesce(p.revoked_at IS NOT NULL,false) revoked
       FROM graph_entities g LEFT JOIN notes n ON g.kind='note' AND n.id=g.resource_id
       LEFT JOIN requests r ON g.kind='request' AND r.id=g.resource_id
       LEFT JOIN participants p ON g.kind='participant' AND p.id=g.resource_id
       LEFT JOIN projects pr ON g.kind='project' AND pr.id=g.resource_id
       WHERE g.project_id=$1 ORDER BY g.kind,g.id LIMIT 200`,
      [projectId],
    );
    const edges: { source: number; target: number; kind: string }[] = [];
    let available = graphEnabled();
    if (available && nodes.length) {
      try {
        const allowed = new Set(nodes.map((n) => n.id));
        for (const kind of [
          "IN_PROJECT",
          "AUTHORED_BY",
          "SOURCE_NOTE",
          "RESULT_NOTE",
          "REQUESTED_FROM",
          "COMMONS_CONTEXT",
        ]) {
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
  async relatedContext(actor: Principal, noteId: string) {
    const source = await this.getNote(actor, noteId);
    await this.connection.query(
      "INSERT INTO graph_notes(id,note_id) SELECT ('x'||substr(replace(id::text,'-',''),1,13))::bit(52)::bigint,id FROM notes WHERE project_id=$1 ON CONFLICT(note_id) DO NOTHING",
      [source.projectId],
    );
    const links = await this.rows<{ source: number; target: number }>(
      `SELECT a.id AS source,b.id AS target FROM requests r
       JOIN graph_notes a ON a.note_id=r.note_id JOIN graph_notes b ON b.note_id=r.result_note_id
       WHERE r.project_id=$1 AND r.completed_at IS NOT NULL AND (r.note_id=$2 OR r.result_note_id=$2) ORDER BY r.created_at DESC LIMIT 20`,
      [source.projectId, noteId],
    );
    const root = await this.one<{ id: number }>(
      "SELECT id FROM graph_notes WHERE note_id=$1",
      [noteId],
    );
    let ids: number[] = [];
    let engine = "postgres";
    if (graphEnabled()) {
      try {
        const sync = await this.one<{ ready: boolean }>(
          "SELECT revision=synced_revision AS ready FROM graph_sync WHERE project_id=$1",
          [source.projectId],
        );
        if (!sync?.ready) throw new Error("Graph projection pending");
        const result = await graphQuery(
          "MATCH (a {id: $source})-[:COMMONS_CONTEXT]-(b) RETURN b.id AS id LIMIT 20",
          { source: root.id },
        );
        ids = result.rows
          .map((row) => Number(row[0]?.value))
          .filter(Number.isSafeInteger);
        engine = "hydradb";
      } catch {
        engine = "postgres-fallback";
      }
    }
    if (engine !== "hydradb")
      ids = links
        .flatMap((link) =>
          link.source === root.id
            ? [link.target]
            : link.target === root.id
              ? [link.source]
              : [],
        )
        .slice(0, 20);
    // Revalidate graph candidates against current project relationships and permissions.
    const valid = new Set(
      links.flatMap((link) =>
        link.source === root.id
          ? [link.target]
          : link.target === root.id
            ? [link.source]
            : [],
      ),
    );
    ids = [...new Set(ids)].filter((id) => valid.has(id));
    await this.getProject(actor, source.projectId);
    const candidates = await this.rows<{ noteId: string }>(
      "SELECT g.note_id FROM graph_notes g JOIN notes n ON n.id=g.note_id WHERE g.id=ANY($1::bigint[]) AND n.project_id=$2 ORDER BY n.created_at DESC,n.id LIMIT 20",
      [ids, source.projectId],
    );
    return {
      engine,
      sourceNoteId: noteId,
      notes: await Promise.all(
        candidates.map((row) => this.getNote(actor, row.noteId)),
      ),
    };
  }
  async searchProject(
    actor: Principal,
    projectId: string,
    input: string,
  ): Promise<SearchResult[]> {
    const query = z.string().trim().max(200).parse(input);
    const project = await this.getProject(actor, projectId);
    const [notes, requests, people] = await Promise.all([
      this.listNotes(actor, projectId, { query }),
      this.listRequests(actor, projectId, { query }),
      this.listParticipants(actor, projectId),
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
      ...notes.notes.slice(0, 8).map((note) => ({
        id: note.id,
        kind: "note" as const,
        title: note.title,
        description: `Note by ${note.authorName}`,
        href: `${base}?note=${note.id}`,
      })),
    );
    results.push(
      ...requests.requests.slice(0, 8).map((request) => ({
        id: request.id,
        kind: "request" as const,
        title: request.title,
        description: `${request.authorName} · ${request.status === "done" ? "Completed" : request.status === "in_progress" ? "Acknowledged" : "Waiting"}`,
        href: `${base}?request=${request.id}`,
      })),
    );
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

  async activity(actor: Principal, projectId: string, after = 0) {
    await this.getProject(actor, projectId);
    return this.rows<Activity>(
      "SELECT a.*,p.name AS author_name FROM activity a JOIN participants p ON p.id=a.author_id WHERE a.project_id=$1 AND a.id>$2 ORDER BY a.id ASC LIMIT 50",
      [projectId, z.number().int().min(0).parse(after)],
    );
  }
}
