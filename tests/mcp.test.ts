import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createServer } from "node:http";
import { Pool } from "pg";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Store } from "../src/lib/store";
import { handleMcp, handleEnrollment } from "../src/lib/mcp";

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
const store = new Store(
  pool,
  "mcp-test-secret-more-than-thirty-two-characters",
);
let base: string,
  token: string,
  projectId: string,
  hiddenId: string,
  noteId: string,
  agentId: string;
let owner: Awaited<ReturnType<Store["authenticate"]>>;
const clients: Client[] = [];
const server = createServer(async (req, res) => {
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers))
      if (value)
        headers.set(key, Array.isArray(value) ? value.join(",") : value);
    const request = new Request(base + req.url, {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method || "GET")
        ? undefined
        : Buffer.concat(chunks),
    });
    const result =
      req.url === "/api/agent/join"
        ? await handleEnrollment(request, store)
        : await handleMcp(request, store);
    res.writeHead(result.status, Object.fromEntries(result.headers));
    res.end(Buffer.from(await result.arrayBuffer()));
  } catch {
    res.writeHead(500);
    res.end();
  }
});
async function connect() {
  const client = new Client({
    name: "commons-integration-client",
    version: "1.0.0",
  });
  await client.connect(
    new StreamableHTTPClientTransport(new URL(base + "/mcp"), {
      requestInit: { headers: { Authorization: `Bearer ${token}` } },
    }),
  );
  clients.push(client);
  return client;
}
function data(result: Awaited<ReturnType<Client["callTool"]>>) {
  assert.ok(Array.isArray(result.content));
  const block = result.content.find((item) => item.type === "text");
  assert.ok(block && block.type === "text");
  return JSON.parse(block.text);
}
before(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  base = `http://127.0.0.1:${address.port}`;
  process.env.APP_URL = base;
  owner = (
    await store.createLocalOwner(
      `mcp-${crypto.randomUUID()}@example.test`,
      "Owner",
    )
  ).actor;
  projectId = (
    await store.createProject(owner, "MCP launch", "Real shared context.")
  ).id;
  hiddenId = (
    await store.createProject(owner, "Private MCP project", "Hidden brief.")
  ).id;
});
after(async () => {
  await Promise.allSettled(clients.map((client) => client.close()));
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await pool.end();
});
test("anonymous clients cannot discover protected tools; hostile origins are rejected", async () => {
  const response = await fetch(base + "/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
  });
  assert.equal(response.status, 401);
  const hostile = await fetch(base + "/mcp", {
    method: "POST",
    headers: { Origin: "https://untrusted.example" },
  });
  assert.equal(hostile.status, 403);
});
test("HTTP enrollment yields a scoped credential and official MCP client performs real reads and writes", async () => {
  const invite = await store.issueInvite(owner, projectId);
  const response = await fetch(base + "/api/agent/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      invitationId: invite.id,
      code: invite.code,
      name: "Codex MCP",
    }),
  });
  assert.equal(response.status, 201);
  const joined = await response.json();
  token = joined.token;
  agentId = joined.participant.id;
  const client = await connect();
  const tools = await client.listTools();
  assert.ok(tools.tools.some((t) => t.name === "publish_note"));
  const projects = data(
    await client.callTool({ name: "list_projects", arguments: {} }),
  );
  assert.equal(projects.length, 1);
  const note = data(
    await client.callTool({
      name: "publish_note",
      arguments: {
        projectId,
        title: "MCP product notes",
        body: "The product is ready for real handoffs.",
        clientKey: crypto.randomUUID(),
      },
    }),
  );
  noteId = note.id;
  assert.equal(
    (await store.getNote(owner, noteId)).body,
    "The product is ready for real handoffs.",
  );
  const denied = await client.callTool({
    name: "read_project",
    arguments: { projectId: hiddenId },
  });
  assert.equal(denied.isError, true);
});
test("retained bearer credential reconnects and sees browser-side contributions", async () => {
  const note = await store.createNote(
    owner,
    projectId,
    {
      title: "Browser contribution",
      body: "Context shared from the browser domain service.",
    },
    crypto.randomUUID(),
  );
  const client = await connect();
  const read = data(
    await client.callTool({
      name: "read_note",
      arguments: { noteId: note.id },
    }),
  );
  assert.equal(read.body, note.body);
  const caught = data(
    await client.callTool({
      name: "catch_up",
      arguments: { projectId, after: 0 },
    }),
  );
  assert.ok(caught.activity.length >= 2);
  assert.ok(caught.cursor > 0);
});
test("revocation rejects an existing MCP connection on its next protected request", async () => {
  const client = await connect();
  await store.revoke(owner, agentId);
  await assert.rejects(
    client.callTool({ name: "list_projects", arguments: {} }),
  );
});
