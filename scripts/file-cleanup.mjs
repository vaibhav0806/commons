import pg from "pg";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const { R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } =
  process.env;
if (!R2_ENDPOINT || !R2_BUCKET || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY)
  throw new Error("Configure private R2 file storage before running cleanup.");
const client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2,
});
const prefix = process.env.R2_PREFIX || "commons-files/",
  once = process.argv.includes("--once");
let running = true;
process.on("SIGTERM", () => {
  running = false;
});
process.on("SIGINT", () => {
  running = false;
});
try {
  do {
    // Abandoned reservations are hidden, but must not retain quota or orphan bytes forever.
    await pool.query(
      "DELETE FROM project_files WHERE NOT ready AND created_at < $1",
      [Date.now() - 3600000],
    );
    const db = await pool.connect();
    try {
      await db.query("BEGIN");
      const jobs = await db.query(
        "SELECT object_key FROM file_cleanup WHERE queued_at < now()-interval '30 seconds' ORDER BY queued_at LIMIT 50 FOR UPDATE SKIP LOCKED",
      );
      for (const { object_key } of jobs.rows) {
        if (!object_key.startsWith(prefix))
          throw new Error("Cleanup key is outside the dedicated file prefix.");
        await client.send(
          new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: object_key }),
        );
        await db.query("DELETE FROM file_cleanup WHERE object_key=$1", [
          object_key,
        ]);
      }
      await db.query("COMMIT");
    } catch {
      await db.query("ROLLBACK");
      console.error("File cleanup failed; durable jobs retained for retry.");
      if (once) process.exitCode = 1;
    } finally {
      db.release();
    }
    if (!once && running)
      await new Promise((resolve) => setTimeout(resolve, 5000));
  } while (!once && running);
} finally {
  client.destroy();
  await pool.end();
}
