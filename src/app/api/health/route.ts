import { Pool } from "pg";
export const runtime = "nodejs";
export async function GET() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: 2000,
  });
  try {
    await pool.query("SELECT name FROM schema_migrations LIMIT 1");
    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  } finally {
    await pool.end();
  }
}
