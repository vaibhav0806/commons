import { createHash } from "node:crypto";
import { types, type Pool } from "pg";
import { graphQuery } from "./graph.ts";

types.setTypeParser(20, Number);
export async function syncGraphProject(pool: Pool, projectId: string) {
  const db = await pool.connect();
  try {
    const lock = await db.query(
      "SELECT pg_try_advisory_lock(hashtext($1)) locked",
      ["graph:" + projectId],
    );
    if (!lock.rows[0].locked) return false;
    await db.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
    const job = (
      await db.query("SELECT * FROM graph_sync WHERE project_id=$1", [
        projectId,
      ])
    ).rows[0];
    if (!job || job.revision === job.synced_revision) {
      await db.query("COMMIT");
      return false;
    }
    const project = (
      await db.query("SELECT * FROM projects WHERE id=$1", [projectId])
    ).rows[0];
    const notes = project
      ? (
          await db.query("SELECT id,author_id FROM notes WHERE project_id=$1", [
            projectId,
          ])
        ).rows
      : [];
    const people = project
      ? (
          await db.query(
            "SELECT id FROM participants WHERE workspace_id=$1 AND ((removed_at IS NULL AND (project_id IS NULL OR project_id=$2)) OR id IN (SELECT author_id FROM notes WHERE project_id=$2))",
            [project.workspace_id, projectId],
          )
        ).rows
      : [];
    const entities = project
      ? [
          { kind: "project", resource: projectId },
          ...people.map((p) => ({
            kind: "participant",
            resource: p.id as string,
          })),
          ...notes.map((n) => ({ kind: "note", resource: n.id as string })),
        ]
      : [];
    const ids = new Map<string, number>();
    for (const entity of entities) {
      const id =
        entity.kind === "note"
          ? Number.parseInt(
              entity.resource.replaceAll("-", "").slice(0, 13),
              16,
            )
          : Number.parseInt(
              createHash("sha256")
                .update(`${projectId}:${entity.kind}:${entity.resource}`)
                .digest("hex")
                .slice(0, 13),
              16,
            );
      await db.query(
        "INSERT INTO graph_entities(id,project_id,resource_id,kind) VALUES($1,$2,$3,$4) ON CONFLICT(project_id,kind,resource_id) DO NOTHING",
        [id, projectId, entity.resource, entity.kind],
      );
      ids.set(`${entity.kind}:${entity.resource}`, id);
    }
    const owned = (
      await db.query("SELECT id FROM graph_entities WHERE project_id=$1", [
        projectId,
      ])
    ).rows;
    await db.query("COMMIT");
    // Keep mappings until cleanup succeeds, including after the project is deleted.
    for (let offset = 0; offset < owned.length; offset += 100) {
      await graphQuery(
        "UNWIND $rows AS row MATCH (n {id: row.id}) DETACH DELETE n",
        { rows: owned.slice(offset, offset + 100) },
      );
    }
    const edges: Record<string, { source: number; target: number }[]> = {
      IN_PROJECT: [],
      AUTHORED_BY: [],
    };
    const id = (kind: string, resource: string) =>
      ids.get(`${kind}:${resource}`)!;
    for (const entity of entities) {
      if (entity.kind !== "project")
        edges.IN_PROJECT.push({
          source: id(entity.kind, entity.resource),
          target: id("project", projectId),
        });
    }
    for (const note of notes)
      edges.AUTHORED_BY.push({
        source: id("note", note.id),
        target: id("participant", note.author_id),
      });
    for (const [kind, rows] of Object.entries(edges)) {
      for (let offset = 0; offset < rows.length; offset += 100) {
        await graphQuery(
          `UNWIND $rows AS row CREATE (a {id: row.source})-[:${kind}]->(b {id: row.target})`,
          { rows: rows.slice(offset, offset + 100) },
        );
      }
    }
    await db.query("BEGIN");
    await db.query(
      "DELETE FROM graph_entities WHERE project_id=$1 AND NOT (id=ANY($2::bigint[]))",
      [projectId, [...ids.values()]],
    );
    if (project) {
      await db.query(
        "UPDATE graph_sync SET synced_revision=$2,synced_at=now(),last_error=NULL WHERE project_id=$1",
        [projectId, job.revision],
      );
    } else {
      await db.query(
        "DELETE FROM graph_sync WHERE project_id=$1 AND revision=$2",
        [projectId, job.revision],
      );
    }
    await db.query("COMMIT");
    return true;
  } catch (error) {
    await db.query("ROLLBACK");
    await db.query(
      "UPDATE graph_sync SET last_error='Graph sync failed; retry pending' WHERE project_id=$1",
      [projectId],
    );
    throw error;
  } finally {
    await db.query("SELECT pg_advisory_unlock(hashtext($1))", [
      "graph:" + projectId,
    ]);
    db.release();
  }
}
