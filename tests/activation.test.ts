import assert from "node:assert/strict";
import { after, test } from "node:test";
import { Pool } from "pg";
import { Store } from "../src/lib/store";
import { handleMcp } from "../src/lib/mcp";

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
const store = new Store(pool, "activation-test-secret-more-than-32-characters");
after(() => pool.end());
const cohort = async (workspaceId: string) =>
  (
    await pool.query(
      "SELECT * FROM workspace_activation WHERE workspace_id=$1",
      [workspaceId],
    )
  ).rows[0];
const newOwner = async () =>
  (await store.createLocalOwner(`${crypto.randomUUID()}@example.test`, "Owner"))
    .actor;

async function call(
  token: string,
  name: string,
  args: Record<string, unknown>,
) {
  const response = await handleMcp(
    new Request(`${process.env.APP_URL}/mcp`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name, arguments: args },
      }),
    }),
    store,
  );
  assert.equal(response.status, 200);
  return (await response.json()).result;
}

test("activation counts committed joins once and only the second agent's shared context retrieval", async () => {
  const owner = await newOwner();
  const outsider = await newOwner();
  try {
    const project = await store.createProject(owner, "Private project", "");
    const hidden = await store.createProject(
      outsider,
      "Outside scope",
      "Private",
    );
    const hiddenPage = await store.createPage(
      outsider,
      hidden.id,
      { title: "Hidden", body: "Secret", parentId: null },
      crypto.randomUUID(),
    );
    const page = await store.createPage(
      owner,
      project.id,
      {
        title: "Private title",
        body: "PRIVATE BODY must not be tracked",
        parentId: null,
      },
      crypto.randomUUID(),
    );
    assert.equal(
      (await cohort(owner.workspaceId)).workspace_created_at,
      owner.createdAt,
    );
    await store.createLocalOwner(owner.email!, "Owner");
    const invites = await Promise.all([
      store.issueInvite(owner, project.id),
      store.issueInvite(owner, project.id),
    ]);
    await assert.rejects(
      store.join(
        invites[0].id,
        "000000" === invites[0].code ? "111111" : "000000",
        "Invalid",
      ),
    );
    assert.equal(
      (await cohort(owner.workspaceId)).first_agent_connected_at,
      null,
    );
    const agents = await Promise.all(
      invites.map((invite, i) =>
        store.join(invite.id, invite.code, `Agent ${i}`),
      ),
    );
    const joined = await cohort(owner.workspaceId);
    assert.ok(joined.first_agent_connected_at);
    assert.ok(joined.second_agent_connected_at);
    assert.notEqual(joined.first_agent_id, joined.second_agent_id);
    const first = agents.find(
      (agent) => agent.actor.id === joined.first_agent_id,
    )!;
    const second = agents.find(
      (agent) => agent.actor.id === joined.second_agent_id,
    )!;
    await assert.rejects(store.join(invites[0].id, invites[0].code, "Replay"));
    await call(first.token, "read_page", { pageId: page.id });
    assert.equal(
      (await cohort(owner.workspaceId)).second_agent_context_read_at,
      null,
    );
    const denied = await call(second.token, "read_page", {
      pageId: hiddenPage.id,
    });
    assert.equal(denied.isError, true);
    const own = await store.createPage(
      second.actor,
      project.id,
      { title: "Own", body: "Own contribution", parentId: null },
      crypto.randomUUID(),
    );
    const empty = await store.createPage(
      owner,
      project.id,
      { title: "Empty", body: " ", parentId: null },
      crypto.randomUUID(),
    );
    for (const id of [own.id, empty.id])
      await call(second.token, "read_page", { pageId: id });
    await call(second.token, "list_pages", { projectId: project.id });
    assert.equal(
      (await cohort(owner.workspaceId)).second_agent_context_read_at,
      null,
    );
    const read = await call(second.token, "read_page", { pageId: page.id });
    assert.notEqual(read.isError, true);
    const activated = await cohort(owner.workspaceId);
    assert.ok(activated.second_agent_context_read_at);
    await Promise.all([
      call(second.token, "read_page", { pageId: page.id }),
      call(second.token, "catch_up", { projectId: project.id }),
    ]);
    assert.deepEqual(await cohort(owner.workspaceId), activated);
    assert.deepEqual(
      Object.keys(activated).sort(),
      [
        "workspace_id",
        "workspace_created_at",
        "first_agent_id",
        "first_agent_connected_at",
        "second_agent_id",
        "second_agent_connected_at",
        "second_agent_context_read_at",
      ].sort(),
    );
    await store.revoke(owner, second.actor.id);
    await assert.rejects(
      store.recordContextRead(second.actor, { type: "page", id: page.id }),
    );
  } finally {
    await store.deleteWorkspace(owner, "DELETE", true);
    await store.deleteWorkspace(outsider, "DELETE", true);
    assert.equal(await cohort(owner.workspaceId), undefined);
  }
});

test("catch_up activates on another contributor's context and reset creates a fresh cohort", async () => {
  let owner = await newOwner();
  try {
    const project = await store.createProject(owner, "Shared", "");
    const one = await store.issueInvite(owner, project.id);
    const first = await store.join(one.id, one.code, "First");
    await store.createPage(
      first.actor,
      project.id,
      { title: "Handoff", body: "Next steps", parentId: null },
      crypto.randomUUID(),
    );
    const two = await store.issueInvite(owner, project.id);
    const second = await store.join(two.id, two.code, "Second");
    await call(second.token, "catch_up", { projectId: project.id });
    assert.ok((await cohort(owner.workspaceId)).second_agent_context_read_at);
    const oldId = owner.workspaceId;
    const workspace = await store.getWorkspace(owner);
    await store.deleteWorkspace(owner, workspace.name);
    owner = (await store.createLocalOwner(owner.email!, "Owner")).actor;
    assert.equal(await cohort(oldId), undefined);
    assert.equal(
      (await cohort(owner.workspaceId)).first_agent_connected_at,
      null,
    );
  } finally {
    await store.deleteWorkspace(owner, "DELETE", true);
  }
});
