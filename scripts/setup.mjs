import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { Pool } from "pg";

if (!existsSync(".env.local"))
  writeFileSync(
    ".env.local",
    readFileSync(".env.example", "utf8").replace(
      "COMMONS_SECRET=\n",
      `COMMONS_SECRET=${randomBytes(32).toString("hex")}\n`,
    ),
    { mode: 0o600 },
  );
process.loadEnvFile(".env.local");
const app = new URL(process.env.APP_URL),
  database = new URL(process.env.DATABASE_URL),
  testDatabase = new URL(process.env.TEST_DATABASE_URL);
for (const url of [app, database, testDatabase])
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
    throw new Error("This setup command is for a local Commons instance.");
function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { stdio: "inherit", env });
  if (result.status !== 0) throw new Error(`Setup command failed: ${command}`);
}
run("docker", ["compose", "up", "-d", "--wait", "db"]);
run(process.execPath, [
  "--env-file=.env.local",
  "--import",
  "tsx",
  "scripts/migrate.ts",
]);
const testName = decodeURIComponent(testDatabase.pathname.slice(1));
if (!/^[a-zA-Z][a-zA-Z0-9_]*_test$/.test(testName))
  throw new Error("TEST_DATABASE_URL must name a database ending in _test.");
const admin = new URL(testDatabase);
admin.pathname = "/postgres";
const pool = new Pool({ connectionString: admin.href });
try {
  if (
    !(
      await pool.query("SELECT 1 FROM pg_database WHERE datname=$1", [testName])
    ).rowCount
  )
    await pool.query(`CREATE DATABASE "${testName}"`);
} finally {
  await pool.end();
}
run(
  process.execPath,
  ["--env-file=.env.local", "--import", "tsx", "scripts/migrate.ts"],
  { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
);
console.log("Commons is ready. Start it with npm run dev.");
