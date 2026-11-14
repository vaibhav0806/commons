import pg from "pg";
import { syncGraphProject } from "../src/lib/graph-projection.ts";
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2,
});
const once = process.argv.includes("--once");
let running = true;
process.on("SIGTERM", () => {
  running = false;
});
process.on("SIGINT", () => {
  running = false;
});
try {
  do {
    const jobs = await pool.query(
      "SELECT project_id FROM graph_sync WHERE revision>synced_revision ORDER BY synced_at NULLS FIRST LIMIT 20",
    );
    for (const { project_id } of jobs.rows) {
      try {
        await syncGraphProject(pool, project_id);
      } catch {
        console.error("Graph sync failed; durable job retained for retry.");
        if (once) process.exitCode = 1;
      }
    }
    if (!once && running)
      await new Promise((resolve) => setTimeout(resolve, 5000));
  } while (!once && running);
} finally {
  await pool.end();
}
