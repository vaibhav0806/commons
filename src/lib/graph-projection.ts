import { createHash } from "node:crypto";
import type { Pool } from "pg";
import { graphQuery } from "./graph.ts";

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
    const notes = (
      await db.query("SELECT id,author_id FROM notes WHERE project_id=$1", [
        projectId,
      ])
    ).rows;
    const requests = (
      await db.query(
        "SELECT id,author_id,note_id,result_note_id,completed_at FROM requests WHERE project_id=$1",
        [projectId],
      )
    ).rows;
    const recipients = (
      await db.query(
        "SELECT request_id,participant_id FROM recipients WHERE project_id=$1",
        [projectId],
      )
    ).rows;
    const people = (
      await db.query(
        "SELECT id FROM participants WHERE workspace_id=$1 AND (project_id IS NULL OR project_id=$2)",
        [project.workspace_id, projectId],
      )
    ).rows;
    const entities = [
      { kind: "project", resource: projectId },
      ...people.map((r) => ({ kind: "participant", resource: r.id as string })),
      ...notes.map((r) => ({ kind: "note", resource: r.id as string })),
      ...requests.map((r) => ({ kind: "request", resource: r.id as string })),
    ];
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
      if (entity.kind === "note")
        await db.query(
          "INSERT INTO graph_notes(id,note_id) VALUES($1,$2) ON CONFLICT(note_id) DO NOTHING",
          [id, entity.resource],
        );
      ids.set(`${entity.kind}:${entity.resource}`, id);
    }
    await db.query("COMMIT");
    const id = (kind: string, resource: string) =>
      ids.get(`${kind}:${resource}`)!;
    const edges: Record<string, { source: number; target: number }[]> = {};
    const edge = (type: string, source: number, target: number) => {
      if (source === undefined || target === undefined)
        throw new Error("Incomplete graph mapping");
      (edges[type] ??= []).push({ source, target });
    };
    for (const entity of entities)
      if (entity.kind !== "project")
        edge(
          "IN_PROJECT",
          id(entity.kind, entity.resource),
          id("project", projectId),
        );
    for (const note of notes)
      edge(
        "AUTHORED_BY",
        id("note", note.id),
        id("participant", note.author_id),
      );
    for (const request of requests) {
      edge(
        "AUTHORED_BY",
        id("request", request.id),
        id("participant", request.author_id),
      );
      if (request.note_id)
        edge(
          "SOURCE_NOTE",
          id("request", request.id),
          id("note", request.note_id),
        );
      if (request.result_note_id)
        edge(
          "RESULT_NOTE",
          id("request", request.id),
          id("note", request.result_note_id),
        );
      if (request.completed_at && request.note_id && request.result_note_id)
        edge(
          "COMMONS_CONTEXT",
          id("note", request.note_id),
          id("note", request.result_note_id),
        );
    }
    for (const recipient of recipients)
      edge(
        "REQUESTED_FROM",
        id("request", recipient.request_id),
        id("participant", recipient.participant_id),
      );
    for (const [type, rows] of Object.entries(edges)) {
      for (let offset = 0; offset < rows.length; offset += 100) {
        await graphQuery(
          `UNWIND $rows AS row CREATE (a {id: row.source})-[:${type}]->(b {id: row.target})`,
          { rows: rows.slice(offset, offset + 100) },
        );
      }
    }
    await db.query(
      "UPDATE graph_sync SET synced_revision=$2,synced_at=now(),last_error=NULL WHERE project_id=$1",
      [projectId, job.revision],
    );
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
