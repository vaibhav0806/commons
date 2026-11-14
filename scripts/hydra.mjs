import { mkdirSync, existsSync, writeFileSync, readFileSync } from "node:fs";
import { randomBytes, randomInt, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";

const tokenPath = "data/hydradb/auth-token";
function docker(...args) {
  const result = spawnSync(
    "docker",
    ["compose", "--profile", "graph", ...args],
    { stdio: "inherit" },
  );
  if (result.status !== 0) throw new Error("HydraDB Docker command failed.");
}
async function ready() {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const response = await fetch("http://127.0.0.1:19090/readyz", {
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(
    "HydraDB did not become ready. Run docker compose logs hydra.",
  );
}
async function query(query, parameters = {}) {
  const response = await fetch(
    "http://127.0.0.1:18443/v1/graphs/commons/query",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${readFileSync(tokenPath, "utf8").trim()}`,
        "X-Graph-Namespace": "commons",
      },
      body: JSON.stringify({
        cell_id: "cell-0",
        query_id: randomUUID(),
        query,
        parameters,
      }),
      signal: AbortSignal.timeout(15000),
    },
  );
  const body = await response.json();
  if (!response.ok || body.error)
    throw new Error(`HydraDB query failed: ${JSON.stringify(body)}`);
  return body;
}
const command = process.argv[2];
if (command === "up") {
  mkdirSync("data/hydradb", { recursive: true, mode: 0o700 });
  if (!existsSync(tokenPath))
    writeFileSync(tokenPath, randomBytes(32).toString("hex"), { mode: 0o644 });
  docker("up", "-d", "hydra");
  await ready();
  console.log("HydraDB ready on http://127.0.0.1:18443 (local graph API).");
} else if (command === "down") {
  docker("stop", "hydra");
} else if (command === "test") {
  await ready();
  const source = randomInt(1_000_000_000_000, 2_000_000_000_000),
    target = source + 1;
  try {
    await query("MERGE (a {id: $source})-[:COMMONS_SMOKE]->(b {id: $target})", {
      source,
      target,
    });
    docker("restart", "hydra");
    await ready();
    const result = await query(
      "MATCH (a {id: $source})-[:COMMONS_SMOKE]->(b) RETURN b.id AS id",
      { source },
    );
    assert.deepEqual(result.rows, [[{ type: "vertex_id", value: target }]]);
  } finally {
    await query("MATCH (a {id: $source}) DETACH DELETE a", { source });
    await query("MATCH (a {id: $target}) DETACH DELETE a", { target });
  }
  console.log(
    "HydraDB write, restart persistence, traversal, and cleanup passed.",
  );
} else {
  throw new Error("Usage: node scripts/hydra.mjs up|down|test");
}
