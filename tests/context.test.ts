import assert from "node:assert/strict";
import { test } from "node:test";
import { Pool } from "pg";
import { Store, CommonsError } from "../src/lib/store";
import { syncGraphProject } from "../src/lib/graph-projection";
import { graphQuery } from "../src/lib/graph";

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
const store = new Store(pool, "context-test-secret-over-thirty-two-characters");
process.env.HYDRA_URL = "http://127.0.0.1:18443";
process.env.HYDRA_TOKEN_FILE = "data/hydradb/auth-token";

test("Hydra reconciles notes, access changes and deleted projects; outages retain cleanup jobs", async () => {
  const owner = (
    await store.createLocalOwner(
      `context-${crypto.randomUUID()}@example.test`,
      "Graph Owner",
    )
  ).actor;
  const project = await store.createProject(
    owner,
    "Graph CRUD",
    "Shared context",
  );
  const other = await store.createProject(owner, "Unrelated", "");
  const invite = await store.issueInvite(owner, project.id);
  const agent = (await store.join(invite.id, invite.code, "Graph Agent")).actor;
  const note = await store.createNote(
    agent,
    project.id,
    { title: "Context", body: "Shared note" },
    crypto.randomUUID(),
  );
  const untouched = await store.createNote(
    owner,
    other.id,
    { title: "Unrelated", body: "Keep this" },
    crypto.randomUUID(),
  );
  const file = await store.reserveFile(owner, project.id, {
    name: "graph.md",
    size: 1,
    mimeType: "application/octet-stream",
    checksum: "a".repeat(64),
  });
  await store.completeFile(owner, file.id);
  const parent = await store.createPage(owner, project.id, {
    title: "Parent",
    body: "",
    parentId: null,
  });
  const child = await store.createPage(owner, project.id, {
    title: "Child",
    body: `[file](/api/files/${file.id})`,
    parentId: parent.id,
  });
  try {
    await syncGraphProject(pool, project.id);
    await syncGraphProject(pool, other.id);
    const initial = await store.inspectGraph(owner, project.id);
    assert.equal(initial.available, true);
    assert.ok(initial.edges.some((e) => e.kind === "AUTHORED_BY"));
    assert.ok(
      initial.nodes.some((n) => n.kind === "page" && n.resourceId === child.id),
    );
    assert.ok(
      initial.nodes.some((n) => n.kind === "file" && n.resourceId === file.id),
    );
    assert.ok(initial.edges.some((e) => e.kind === "IN_PAGE"));
    assert.ok(initial.edges.some((e) => e.kind === "REFERENCES"));
    await assert.rejects(store.inspectGraph(agent, project.id), CommonsError);
    const ids = initial.nodes.map((n) => n.id);
    const unrelatedId = (await store.inspectGraph(owner, other.id)).nodes.find(
      (n) => n.resourceId === untouched.id,
    )!.id;
    await store.updateNote(
      agent,
      note.id,
      { title: "Edited", body: "New context" },
      note.version,
    );
    await syncGraphProject(pool, project.id);
    assert.equal(
      (await store.inspectGraph(owner, project.id)).edges.length,
      initial.edges.length,
    );
    await store.deleteNote(owner, note.id, 2);
    const endpoint = process.env.HYDRA_URL;
    process.env.HYDRA_URL = "http://127.0.0.1:1";
    await assert.rejects(syncGraphProject(pool, project.id));
    const pending = (
      await pool.query("SELECT * FROM graph_sync WHERE project_id=$1", [
        project.id,
      ])
    ).rows[0];
    assert.ok(pending.revision > pending.synced_revision);
    assert.ok(pending.last_error);
    process.env.HYDRA_URL = endpoint;
    await syncGraphProject(pool, project.id);
    const deletedId = initial.nodes.find((n) => n.resourceId === note.id)!.id;
    assert.equal(
      (
        await graphQuery("MATCH (a {id: $id})-[:IN_PROJECT]->(b) RETURN b.id", {
          id: deletedId,
        })
      ).rows.length,
      0,
    );
    await store.updateAgent(owner, agent.id, "Graph Agent", other.id);
    await syncGraphProject(pool, project.id);
    assert.ok(
      !(await store.inspectGraph(owner, project.id)).nodes.some(
        (n) => n.resourceId === agent.id,
      ),
    );
    await store.deleteProject(owner, project.id, "Graph CRUD");
    await syncGraphProject(pool, project.id);
    assert.equal(
      (
        await pool.query("SELECT 1 FROM graph_entities WHERE project_id=$1", [
          project.id,
        ])
      ).rowCount,
      0,
    );
    assert.equal(
      (
        await pool.query("SELECT 1 FROM graph_sync WHERE project_id=$1", [
          project.id,
        ])
      ).rowCount,
      0,
    );
    for (const id of ids)
      assert.equal(
        (await graphQuery("MATCH (n {id: $id}) RETURN n.id", { id })).rows
          .length,
        0,
      );
    assert.ok(
      (await graphQuery("MATCH (n {id: $id}) RETURN n.id", { id: unrelatedId }))
        .rows.length,
    );
  } finally {
    process.env.HYDRA_URL = "http://127.0.0.1:18443";
    await store.deleteWorkspace(owner, "DELETE", true);
    await syncGraphProject(pool, project.id);
    await syncGraphProject(pool, other.id);
    await pool.end();
  }
});
