import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { Pool } from "pg";
import { Store, CommonsError } from "../src/lib/store";

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
const store = new Store(
  pool,
  "commons-test-secret-with-more-than-32-characters",
);
let owner: Awaited<ReturnType<Store["authenticate"]>>;
let other: typeof owner;
let project: { id: string };
let hidden: { id: string };
let first: typeof owner;
let second: typeof owner;
let firstToken: string;
let noteId: string;
before(async () => {
  const local = await store.createLocalOwner(
    `owner-${crypto.randomUUID()}@example.test`,
    "Owner",
  );
  owner = await store.authenticate(local.token);
  other = (
    await store.createLocalOwner(
      `other-${crypto.randomUUID()}@example.test`,
      "Other",
    )
  ).actor;
  project = await store.createProject(owner, "Launch", "A shared launch.");
  hidden = await store.createProject(owner, "Private", "A private project.");
});
after(async () => {
  await pool.end();
});

test("real sessions reject arbitrary credentials and retain owner identity", async () => {
  assert.equal(owner.kind, "owner");
  await assert.rejects(store.authenticate("invalid"), CommonsError);
  const again = await store.createLocalOwner(owner.email!, "Owner");
  assert.equal(again.actor.id, owner.id);
});
test("single-project invitation redeems exactly once under concurrent attempts", async () => {
  const invite = await store.issueInvite(owner, project.id);
  assert.match(invite.code, /^\d{6}$/);
  const results = await Promise.allSettled([
    store.join(invite.id, invite.code, "Codex"),
    store.join(invite.id, invite.code, "Codex"),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  const result = results.find((r) => r.status === "fulfilled");
  assert.ok(result?.status === "fulfilled");
  firstToken = result.value.token;
  first = await store.authenticate(firstToken);
  assert.equal(first.projectId, project.id);
  await assert.rejects(
    store.join(invite.id, invite.code, "Replay"),
    CommonsError,
  );
});
test("project and workspace scope isolate resources and participant metadata", async () => {
  const invite = await store.issueInvite(owner, hidden.id);
  await store.join(invite.id, invite.code, "Hidden participant");
  assert.equal((await store.listProjects(first)).length, 1);
  assert.ok(
    !(await store.listParticipants(first, project.id)).some(
      (p) => p.name === "Hidden participant",
    ),
  );
  await assert.rejects(store.getProject(first, hidden.id), CommonsError);
  await assert.rejects(store.getProject(other, project.id), CommonsError);
  await assert.rejects(store.createProject(first, "Illegal", ""), CommonsError);
  await assert.rejects(store.issueInvite(first, project.id), CommonsError);
});
test("workspace grants include future projects", async () => {
  const invite = await store.issueInvite(owner, null);
  second = (await store.join(invite.id, invite.code, "Browser assistant"))
    .actor;
  const next = await store.createProject(owner, "Future", "");
  assert.equal((await store.getProject(second, next.id)).id, next.id);
  await assert.rejects(store.getProject(first, next.id), CommonsError);
});
test("notes are persistent, idempotent, searchable and isolated", async () => {
  const key = crypto.randomUUID();
  const note = await store.createNote(
    first,
    project.id,
    {
      title: "Launch context",
      body: "The product is ready. Ten alpha signups are ready for demos.",
    },
    key,
  );
  noteId = note.id;
  assert.equal(
    (
      await store.createNote(
        first,
        project.id,
        {
          title: "Launch context",
          body: "The product is ready. Ten alpha signups are ready for demos.",
        },
        key,
      )
    ).id,
    noteId,
  );
  assert.equal((await store.getNote(second, noteId)).authorId, first.id);
  assert.equal(
    (await store.listNotes(second, project.id, { query: "alpha" })).notes
      .length,
    1,
  );
  await assert.rejects(store.getNote(other, noteId), CommonsError);
  await assert.rejects(
    store.createNote(
      first,
      hidden.id,
      { title: "Illegal", body: "Hidden" },
      crypto.randomUUID(),
    ),
    CommonsError,
  );
  await assert.rejects(
    store.createNote(
      first,
      project.id,
      {
        title: "Unsafe link",
        body: "text",
        references: [{ label: "bad", url: "javascript:alert(1)" }],
      },
      crypto.randomUUID(),
    ),
  );
});
test("expired invitations and wrong pairing contexts do not enroll", async () => {
  const invite = await store.issueInvite(owner, project.id);
  await assert.rejects(
    store.join(crypto.randomUUID(), invite.code, "Wrong context"),
    CommonsError,
  );
  await pool.query("UPDATE invitations SET expires_at=0 WHERE id=$1", [
    invite.id,
  ]);
  await assert.rejects(
    store.join(invite.id, invite.code, "Expired"),
    CommonsError,
  );
});
test("revocation immediately invalidates all credentials and stale actors while retaining attribution", async () => {
  const token = await store.createCredential(first, "MCP");
  assert.equal((await store.authenticate(token)).id, first.id);
  await store.revoke(owner, first.id);
  await assert.rejects(store.authenticate(token), CommonsError);
  await assert.rejects(store.authenticate(firstToken), CommonsError);
  await assert.rejects(store.listProjects(first), CommonsError);
  assert.equal((await store.getNote(owner, noteId)).authorName, "Codex");
});

test("project search finds body text and the brief without leaking other projects", async () => {
  await store.updateProject(
    owner,
    project.id,
    "Launch",
    "Quartz launch plan.",
    (await store.getProject(owner, project.id)).version,
  );
  const note = await store.createNote(
    owner,
    project.id,
    { title: "Build notes", body: "Quartz features are ready." },
    crypto.randomUUID(),
  );
  await store.createNote(
    owner,
    hidden.id,
    { title: "Quartz private notes", body: "Do not expose this project." },
    crypto.randomUUID(),
  );
  const results = await store.searchProject(second, project.id, "quartz");
  assert.ok(results.some((result) => result.id === note.id));
  assert.ok(results.some((result) => result.kind === "project"));
  assert.ok(!results.some((result) => result.title === "Quartz private notes"));
  await assert.rejects(
    store.searchProject(other, project.id, "quartz"),
    CommonsError,
  );
});

test("return credentials preserve identity and active credentials renew without invitations", async () => {
  let now = Date.now();
  const timed = new Store(
    pool,
    "return-test-secret-more-than-32-characters",
    () => now,
  );
  const host = (
    await timed.createLocalOwner(
      `return-${crypto.randomUUID()}@example.test`,
      "Owner",
    )
  ).actor;
  const invite = await timed.issueInvite(host, null);
  const joined = await timed.join(invite.id, invite.code, "Returning agent");
  now += 80 * 86400000;
  assert.equal((await timed.authenticate(joined.token)).id, joined.actor.id);
  now += 80 * 86400000;
  const resumed = await timed.resumeAgent(joined.token);
  assert.equal(resumed.actor.id, joined.actor.id);
  assert.equal((await timed.authenticate(resumed.token)).id, joined.actor.id);
  await timed.revoke(host, joined.actor.id);
  await assert.rejects(timed.authenticate(joined.token), CommonsError);
  await assert.rejects(timed.authenticate(resumed.token), CommonsError);
  const secondInvite = await timed.issueInvite(host, null);
  const idle = await timed.join(
    secondInvite.id,
    secondInvite.code,
    "Idle agent",
  );
  now += 91 * 86400000;
  await assert.rejects(timed.resumeAgent(idle.token), CommonsError);
});

test("private testing owner login requires the configured key", async () => {
  const key = crypto.randomUUID();
  const hash = createHash("sha256").update(key).digest("hex");
  await assert.rejects(
    store.signInTestOwner("wrong", hash, owner.email!, owner.name),
    CommonsError,
  );
  await assert.rejects(
    store.signInTestOwner(key, "", owner.email!, owner.name),
    CommonsError,
  );
  const result = await store.signInTestOwner(
    key,
    hash,
    owner.email!,
    owner.name,
  );
  assert.equal(result.actor.id, owner.id);
});

test("Google identity links the configured owner, persists by subject, and rejects email takeover", async () => {
  const previous = process.env.COMMONS_OWNER_EMAIL;
  process.env.COMMONS_OWNER_EMAIL = owner.email!;
  const subject = crypto.randomUUID();
  try {
    const linked = await store.signInGoogle(
      subject,
      owner.email!,
      "Google Owner",
    );
    assert.equal(linked.actor.id, owner.id);
    assert.equal(linked.actor.workspaceId, owner.workspaceId);
    assert.equal((await store.authenticate(linked.token)).id, owner.id);
    const returning = await store.signInGoogle(
      subject,
      `changed-${crypto.randomUUID()}@example.test`,
      "New name",
    );
    assert.equal(returning.actor.id, owner.id);
    await assert.rejects(
      store.signInGoogle(crypto.randomUUID(), owner.email!, "Impostor"),
      CommonsError,
    );
    await assert.rejects(
      store.signInGoogle(crypto.randomUUID(), other.email!, "Other"),
      CommonsError,
    );
    const email = `google-${crypto.randomUUID()}@example.test`;
    const newSubject = crypto.randomUUID();
    const results = await Promise.all([
      store.signInGoogle(newSubject, email, "New owner"),
      store.signInGoogle(newSubject, email, "New owner"),
    ]);
    assert.equal(results[0].actor.id, results[1].actor.id);
    assert.notEqual(results[0].actor.workspaceId, owner.workspaceId);
  } finally {
    if (previous === undefined) delete process.env.COMMONS_OWNER_EMAIL;
    else process.env.COMMONS_OWNER_EMAIL = previous;
  }
});

test("Google sign-in state is one-use and expires", async () => {
  const state = crypto.randomUUID();
  await store.beginGoogleSignIn(state, "verifier", "nonce");
  const result = await Promise.allSettled([
    store.consumeGoogleSignIn(state),
    store.consumeGoogleSignIn(state),
  ]);
  assert.equal(result.filter((r) => r.status === "fulfilled").length, 1);
  const expired = crypto.randomUUID();
  const pastStore = new Store(
    pool,
    "commons-test-secret-with-more-than-32-characters",
    () => Date.now() - 700000,
  );
  await pastStore.beginGoogleSignIn(expired, "verifier", "nonce");
  await assert.rejects(store.consumeGoogleSignIn(expired), CommonsError);
  await assert.rejects(store.consumeGoogleSignIn("unknown"), CommonsError);
});

test("project and note CRUD enforce ownership, stale edits and permanent deletion", async () => {
  const p = await store.createProject(owner, "Editable", "Original brief");
  const invite = await store.issueInvite(owner, p.id);
  const a = (await store.join(invite.id, invite.code, "Writer")).actor;
  const n = await store.createNote(
    a,
    p.id,
    { title: "Draft", body: "Original" },
    crypto.randomUUID(),
  );
  await assert.rejects(
    store.updateProject(a, p.id, "No", "No", p.version),
    CommonsError,
  );
  await assert.rejects(
    store.updateProject(other, p.id, "No", "No", p.version),
    CommonsError,
  );
  const renamed = await store.updateProject(
    owner,
    p.id,
    "Renamed",
    "Updated brief",
    p.version,
  );
  assert.equal(renamed.name, "Renamed");
  await assert.rejects(
    store.updateProject(owner, p.id, "Stale", "", p.version),
    (e: unknown) => e instanceof CommonsError && e.status === 409,
  );
  await assert.rejects(
    store.updateNote(other, n.id, { title: "Bad", body: "No" }, n.version),
    CommonsError,
  );
  await assert.rejects(
    store.updateNote(second, n.id, { title: "Bad", body: "No" }, n.version),
    CommonsError,
  );
  const edited = await store.updateNote(
    a,
    n.id,
    {
      title: "Final",
      body: "Updated",
      references: [{ label: "Docs", url: "https://example.com" }],
    },
    n.version,
  );
  assert.ok(edited.editedAt);
  assert.equal(edited.version, 2);
  assert.equal(edited.referenceLinks.length, 1);
  await assert.rejects(
    store.updateNote(a, n.id, { title: "Stale", body: "No" }, n.version),
    CommonsError,
  );
  await assert.rejects(store.deleteNote(a, n.id, n.version), CommonsError);
  await store.deleteNote(owner, n.id, edited.version);
  await assert.rejects(store.getNote(a, n.id), CommonsError);
  assert.equal((await store.searchProject(owner, p.id, "Final")).length, 0);
  await assert.rejects(store.deleteProject(owner, p.id, "Wrong"), CommonsError);
  await store.deleteProject(owner, p.id, "Renamed");
  await assert.rejects(store.getProject(owner, p.id), CommonsError);
  await assert.rejects(store.listProjects(a), CommonsError);
  assert.ok(
    (await pool.query("SELECT 1 FROM graph_sync WHERE project_id=$1", [p.id]))
      .rowCount,
  );
});

test("concurrent note edits accept one version and reject a lost update", async () => {
  const n = await store.createNote(
    owner,
    project.id,
    { title: "Concurrent", body: "Initial" },
    crypto.randomUUID(),
  );
  const results = await Promise.allSettled([
    store.updateNote(owner, n.id, { title: "First", body: "A" }, n.version),
    store.updateNote(owner, n.id, { title: "Second", body: "B" }, n.version),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal((await store.getNote(owner, n.id)).version, 2);
});

test("agent access changes apply to saved credentials and removal retains note attribution", async () => {
  const invite = await store.issueInvite(owner, null);
  const a = await store.join(invite.id, invite.code, "Original agent");
  const n = await store.createNote(
    a.actor,
    project.id,
    { title: "Authored", body: "Retain this." },
    crypto.randomUUID(),
  );
  await assert.rejects(
    store.updateAgent(other, a.actor.id, "Wrong", null),
    CommonsError,
  );
  await store.updateAgent(owner, a.actor.id, "Renamed agent", hidden.id);
  const returned = await store.authenticate(a.token);
  assert.equal(returned.name, "Renamed agent");
  await assert.rejects(store.getNote(a.actor, n.id), CommonsError);
  assert.equal((await store.getNote(owner, n.id)).authorName, "Renamed agent");
  await store.removeAgent(owner, a.actor.id);
  await assert.rejects(store.authenticate(a.token), CommonsError);
  assert.ok(
    !(await store.listParticipants(owner, undefined, true)).some(
      (p) => p.id === a.actor.id,
    ),
  );
  assert.equal((await store.getNote(owner, n.id)).authorName, "Renamed agent");
});

test("pending invitations can be cancelled and credentials revoked individually", async () => {
  const invite = await store.issueInvite(owner, project.id);
  assert.ok(
    (await store.listInvitations(owner)).some((i) => i.id === invite.id),
  );
  await store.cancelInvitation(other, invite.id);
  await store.cancelInvitation(owner, invite.id);
  await assert.rejects(
    store.join(invite.id, invite.code, "Late agent"),
    CommonsError,
  );
  const joinInvite = await store.issueInvite(owner, null);
  const a = await store.join(
    joinInvite.id,
    joinInvite.code,
    "Connection agent",
  );
  const extra = await store.createCredential(a.actor, "Independent client");
  const connections = await store.listSessions(a.actor, a.token);
  assert.equal(connections.filter((s) => s.current).length, 1);
  assert.ok(!JSON.stringify(connections).includes(extra));
  const target = connections.find((s) => !s.current)!;
  await store.revokeSession(other, target.id);
  await store.authenticate(extra);
  await store.revokeSession(owner, target.id);
  await assert.rejects(store.authenticate(extra), CommonsError);
  await store.authenticate(a.token);
  const next = await store.createCredential(a.actor, "Another client");
  await store.signOutOthers(a.actor, a.token);
  await assert.rejects(store.authenticate(next), CommonsError);
  await store.authenticate(a.token);
});

test("workspace deletion preserves account; account deletion removes identity and all scoped data", async () => {
  const login = await store.signInGoogle(
    `sub-${crypto.randomUUID()}`,
    `delete-${crypto.randomUUID()}@example.test`,
    "Delete Owner",
  );
  let a = login.actor;
  const workspace = await store.getWorkspace(a);
  const p = await store.createProject(a, "Disposable", "");
  const invite = await store.issueInvite(a, p.id);
  const agent = await store.join(invite.id, invite.code, "Disposable agent");
  await store.createNote(
    agent.actor,
    p.id,
    { title: "Disposable", body: "Context" },
    crypto.randomUUID(),
  );
  await assert.rejects(store.deleteWorkspace(a, "Wrong"), CommonsError);
  await store.deleteWorkspace(a, workspace.name);
  a = await store.authenticate(login.token);
  assert.notEqual(a.workspaceId, workspace.id);
  assert.equal((await store.listProjects(a)).length, 0);
  await assert.rejects(store.authenticate(agent.token), CommonsError);
  await store.updateProfile(a, "New Name");
  assert.equal((await store.authenticate(login.token)).name, "New Name");
  await store.deleteWorkspace(a, "DELETE", true);
  await assert.rejects(store.authenticate(login.token), CommonsError);
  assert.equal(
    (
      await pool.query(
        "SELECT 1 FROM google_identities WHERE participant_id=$1",
        [a.id],
      )
    ).rowCount,
    0,
  );
  assert.equal(
    (await pool.query("SELECT 1 FROM workspaces WHERE id=$1", [a.workspaceId]))
      .rowCount,
    0,
  );
  assert.ok((await store.listProjects(owner)).length > 0);
});
