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
let requestId: string;
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
test("directed requests validate recipients, link context, and separate read/ack/completion", async () => {
  const secretAgent = (await store.listParticipants(owner, hidden.id)).find(
    (p) => p.name === "Hidden participant",
  )!;
  await assert.rejects(
    store.createRequest(
      first,
      project.id,
      {
        title: "Illegal",
        body: "Hidden mention",
        recipientIds: [secretAgent.id],
      },
      crypto.randomUUID(),
    ),
    CommonsError,
  );
  const request = await store.createRequest(
    first,
    project.id,
    {
      title: "Draft a launch post",
      body: "Use the product notes.",
      recipientIds: [second.id],
      noteId,
    },
    crypto.randomUUID(),
  );
  requestId = request.id;
  assert.equal(
    (await store.listRequests(second, project.id, { mine: true })).requests[0]
      .id,
    requestId,
  );
  await store.markRead(second, noteId);
  assert.equal((await store.getRequest(second, requestId)).status, "open");
  assert.equal(
    (await store.listNotes(second, project.id, { unread: true })).notes.length,
    0,
  );
  await assert.rejects(store.acknowledge(first, requestId), CommonsError);
  await store.acknowledge(second, requestId);
  assert.equal(
    (await store.getRequest(first, requestId)).status,
    "in_progress",
  );
  const result = await store.createNote(
    second,
    project.id,
    {
      title: "Launch draft",
      body: "Launching Commons. A shared workspace for independent assistants.",
    },
    crypto.randomUUID(),
  );
  await store.completeRequest(second, requestId, result.id);
  assert.equal(
    (await store.getRequest(first, requestId)).resultNoteId,
    result.id,
  );
  assert.equal((await store.getRequest(first, requestId)).status, "done");
});
test("agents cannot modify owner briefs and unmentioned agents cannot complete requests", async () => {
  await assert.rejects(
    store.updateBrief(first, project.id, "Changed"),
    CommonsError,
  );
  const request = await store.createRequest(
    owner,
    project.id,
    {
      title: "For Codex",
      body: "A directed request.",
      recipientIds: [first.id],
    },
    crypto.randomUUID(),
  );
  await assert.rejects(store.completeRequest(second, request.id), CommonsError);
  await assert.rejects(store.completeRequest(first, request.id), CommonsError);
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

test("request retries do not duplicate acknowledgement or completion activity", async () => {
  const request = await store.createRequest(
    owner,
    project.id,
    {
      title: "Retry-safe handoff",
      body: "Acknowledge and complete once.",
      recipientIds: [second.id],
    },
    crypto.randomUUID(),
  );
  await store.acknowledge(second, request.id);
  await store.acknowledge(second, request.id);
  await store.completeRequest(second, request.id);
  await store.completeRequest(second, request.id);
  const events = (await store.activity(owner, project.id)).filter(
    (e) => e.resourceId === request.id,
  );
  assert.equal(
    events.filter((e) => e.description === "Acknowledged a request").length,
    1,
  );
  assert.equal(
    events.filter((e) => e.description === "Completed a request").length,
    1,
  );
});

test("project search finds body text, requests and the brief without leaking other projects", async () => {
  await store.updateBrief(owner, project.id, "Quartz launch plan.");
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
  const request = await store.createRequest(
    owner,
    project.id,
    {
      title: "Schedule calls",
      body: "Quartz alpha demos.",
      recipientIds: [second.id],
    },
    crypto.randomUUID(),
  );
  const results = await store.searchProject(second, project.id, "quartz");
  assert.ok(results.some((result) => result.id === note.id));
  assert.ok(results.some((result) => result.id === request.id));
  assert.ok(results.some((result) => result.kind === "project"));
  assert.ok(!results.some((result) => result.title === "Quartz private notes"));
  await assert.rejects(
    store.searchProject(other, project.id, "quartz"),
    CommonsError,
  );
});
