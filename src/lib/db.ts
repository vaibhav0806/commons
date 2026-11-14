import { Pool } from "pg";
import { Store } from "./store";

const globals = globalThis as unknown as { commonsPool?: Pool };
export function getStore() {
  if (!process.env.DATABASE_URL)
    throw new Error("Set DATABASE_URL and run npm run db:migrate.");
  if (!process.env.COMMONS_SECRET || process.env.COMMONS_SECRET.length < 32)
    throw new Error("Set COMMONS_SECRET to at least 32 random characters.");
  if (!globals.commonsPool) {
    globals.commonsPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
    });
    globals.commonsPool.on("error", () =>
      console.error(
        "A Postgres connection was interrupted. The pool will reconnect.",
      ),
    );
  }
  return new Store(globals.commonsPool, process.env.COMMONS_SECRET);
}
