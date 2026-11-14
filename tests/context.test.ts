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

test("Hydra retrieves linked context, rejects unrelated context and falls back during outages", async () => {
  const owner = (
    await store.createLocalOwner(
      `context-${crypto.randomUUID()}@example.test`,
      "Owner",
    )
  ).actor;
  const project = await store.createProject(
    owner,
    "Launch",
    "Use the product notes to schedule demos.",
  );
  const hidden = await store.createProject(owner, "Hidden", "Private context.");
  const invite = await store.issueInvite(owner, project.id);
  const agent = (await store.join(invite.id, invite.code, "Assistant")).actor;
  const source = await store.createNote(
    owner,
    project.id,
    { title: "Product notes", body: "Ten alpha users need Friday demos." },
    crypto.randomUUID(),
  );
  const output = await store.createNote(
    agent,
    project.id,
    { title: "Demo schedule", body: "Ten Friday calls are booked." },
    crypto.randomUUID(),
  );
  const unrelated = await store.createNote(
    owner,
    hidden.id,
    { title: "Hidden secret", body: "Must never appear." },
    crypto.randomUUID(),
  );
  const request = await store.createRequest(
    owner,
    project.id,
    {
      title: "Book demos",
      body: "Use the signups.",
      recipientIds: [agent.id],
      noteId: source.id,
    },
    crypto.randomUUID(),
  );
  await store.acknowledge(agent, request.id);
  await store.completeRequest(agent, request.id, output.id);
  let graphIds: number[] = [];
  const standalone = await store.createNote(
    owner,
    project.id,
    { title: "Independent update", body: "No request references this note." },
    crypto.randomUUID(),
  );
  try {
    assert.equal(
      (await store.relatedContext(agent, source.id)).engine,
      "postgres-fallback",
    );
    assert.equal(await syncGraphProject(pool, project.id), true);
    const snapshot = await store.inspectGraph(owner, project.id);
    assert.equal(snapshot.available, true);
    const node = snapshot.nodes.find((n) => n.resourceId === standalone.id)!;
    assert.ok(node);
    assert.ok(
      snapshot.edges.some(
        (e) => e.source === node.id && e.kind === "IN_PROJECT",
      ),
    );
    assert.ok(
      snapshot.edges.some(
        (e) => e.source === node.id && e.kind === "AUTHORED_BY",
      ),
    );
    assert.equal(
      (await store.relatedContext(agent, standalone.id)).notes.length,
      0,
    );
    await assert.rejects(store.inspectGraph(agent, project.id), CommonsError);
    await pool.query(
      "UPDATE graph_sync SET revision=revision+1 WHERE project_id=$1",
      [project.id],
    );
    await syncGraphProject(pool, project.id);
    assert.deepEqual(
      (await store.inspectGraph(owner, project.id)).edges,
      snapshot.edges,
    );
    const result = await store.relatedContext(agent, source.id);
    assert.equal(result.engine, "hydradb");
    assert.deepEqual(
      result.notes.map((note) => note.id),
      [output.id],
    );
    assert.equal(
      (await store.relatedContext(agent, output.id)).notes[0].id,
      source.id,
    );
    await assert.rejects(
      store.relatedContext(agent, unrelated.id),
      CommonsError,
    );
    graphIds = (
      await pool.query(
        "SELECT id FROM graph_notes WHERE note_id=ANY($1::uuid[])",
        [[source.id, output.id]],
      )
    ).rows.map((r) => Number(r.id));
    const root = (
      await pool.query("SELECT id FROM graph_notes WHERE note_id=$1", [
        source.id,
      ])
    ).rows[0].id;
    const poison = Number.parseInt(
      unrelated.id.replaceAll("-", "").slice(0, 13),
      16,
    );
    graphIds.push(poison);
    await graphQuery(
      "MERGE (a {id: $source})-[:COMMONS_CONTEXT]->(b {id: $target})",
      { source: Number(root), target: poison },
    );
    assert.deepEqual(
      (await store.relatedContext(agent, source.id)).notes.map(
        (note) => note.id,
      ),
      [output.id],
    );
    process.env.HYDRA_URL = "http://127.0.0.1:1";
    await pool.query(
      "UPDATE graph_sync SET revision=revision+1 WHERE project_id=$1",
      [project.id],
    );
    await assert.rejects(syncGraphProject(pool, project.id));
    const job = (
      await pool.query(
        "SELECT revision>synced_revision pending,last_error FROM graph_sync WHERE project_id=$1",
        [project.id],
      )
    ).rows[0];
    assert.equal(job.pending, true);
    assert.ok(job.last_error);
    const fallback = await store.relatedContext(agent, source.id);
    assert.equal(fallback.engine, "postgres-fallback");
    assert.equal(fallback.notes[0].id, output.id);
  } finally {
    process.env.HYDRA_URL = "http://127.0.0.1:18443";
    await syncGraphProject(pool, project.id);
    assert.equal(
      (await store.relatedContext(agent, source.id)).engine,
      "hydradb",
    );
    graphIds.push(
      ...(
        await pool.query("SELECT id FROM graph_entities WHERE project_id=$1", [
          project.id,
        ])
      ).rows.map((r) => Number(r.id)),
    );
    for (const source of new Set(graphIds))
      await graphQuery("MATCH (a {id: $source}) DETACH DELETE a", { source });
    await pool.end();
  }
});
