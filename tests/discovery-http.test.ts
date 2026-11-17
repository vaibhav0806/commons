import assert from "node:assert/strict";
import { test } from "node:test";
import { Pool } from "pg";
import { Store } from "../src/lib/store";

// Run against a local production build using the same .env.local as that server.
const base = process.env.TEST_BASE_URL;
if (base && !["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw new Error("Use a local test server.");

test(
  "public sitemap contains only indexable canonical routes",
  { skip: !base },
  async () => {
    const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
    const paths = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(
      (match) => new URL(match[1]).pathname,
    );
    assert.deepEqual(
      paths.sort(),
      [
        "/",
        "/privacy",
        "/docs",
        "/docs/connect",
        "/docs/commons-page",
        "/docs/collaboration",
      ].sort(),
    );
    for (const path of paths) {
      const response = await fetch(base + path);
      assert.equal(response.status, 200);
      const html = await response.text();
      assert.match(html, /name="robots" content="index, follow"/);
      const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
      assert.ok(canonical);
      assert.equal(new URL(canonical).pathname, path);
      assert.match(html, /property="og:url"/);
      assert.match(html, /name="twitter:card" content="summary_large_image"/);
      assert.equal(response.headers.get("x-robots-tag"), null);
    }
    const robots = await (await fetch(`${base}/robots.txt`)).text();
    assert.match(robots, /Disallow: \/workspace/);
    assert.match(robots, /Disallow: \/api\//);
    assert.ok(robots.includes(`Sitemap: ${process.env.APP_URL}/sitemap.xml`));
    const missing = await fetch(`${base}/docs/missing`);
    assert.equal(missing.status, 404);
    assert.match(await missing.text(), /name="robots" content="noindex/);
  },
);

test(
  "private routes are noindex and unauthenticated content stays protected",
  { skip: !base },
  async () => {
    for (const path of [
      "/workspace",
      "/workspace/settings",
      "/join",
      "/start",
      "/api/search",
      "/mcp",
      `/api/files/${crypto.randomUUID()}`,
    ]) {
      const response = await fetch(base + path, { redirect: "manual" });
      assert.match(response.headers.get("x-robots-tag") || "", /noindex/);
      if (path.startsWith("/workspace")) assert.equal(response.status, 307);
      if (path.startsWith("/api/")) assert.equal(response.status, 401);
    }
  },
);

test(
  "browser activation requires authenticated scoped reads; prefetch is not activation",
  { skip: !base },
  async () => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const store = new Store(pool, process.env.COMMONS_SECRET!);
    const owner = (
      await store.createLocalOwner(
        `${crypto.randomUUID()}@example.test`,
        "HTTP test owner",
      )
    ).actor;
    const other = (
      await store.createLocalOwner(
        `${crypto.randomUUID()}@example.test`,
        "Other owner",
      )
    ).actor;
    const milestone = async () =>
      (
        await pool.query(
          "SELECT second_agent_context_read_at FROM workspace_activation WHERE workspace_id=$1",
          [owner.workspaceId],
        )
      ).rows[0].second_agent_context_read_at;
    try {
      const project = await store.createProject(owner, "HTTP test", "");
      const hidden = await store.createProject(other, "Hidden", "");
      const page = await store.createPage(
        owner,
        project.id,
        { title: "Context", body: "Private body", parentId: null },
        crypto.randomUUID(),
      );
      const inaccessible = await store.createPage(
        other,
        hidden.id,
        { title: "Hidden", body: "Private body", parentId: null },
        crypto.randomUUID(),
      );
      const invite = await store.issueInvite(owner, project.id);
      await store.join(invite.id, invite.code, "First");
      const secondInvite = await store.issueInvite(owner, project.id);
      const second = await store.join(
        secondInvite.id,
        secondInvite.code,
        "Second",
      );
      const headers = {
        Cookie: `commons_session=${second.token}`,
        "Content-Type": "application/json",
        Origin: base!,
      };
      const send = (body: unknown, extra = {}) =>
        fetch(`${base}/api/activation/read`, {
          method: "POST",
          headers: { ...headers, ...extra },
          body: JSON.stringify(body),
        });
      const read = { type: "page", id: page.id };
      assert.equal((await send(read, { Cookie: "" })).status, 401);
      assert.equal(
        (await send(read, { Origin: "https://outside.example" })).status,
        403,
      );
      assert.equal(
        (await send({ ...read, body: "Should not be accepted" })).status,
        400,
      );
      assert.equal((await send({ ...read, id: inaccessible.id })).status, 403);
      const view = await fetch(
        `${base}/workspace/projects/${project.id}/pages/${page.id}`,
        { headers: { Cookie: headers.Cookie, "Next-Router-Prefetch": "1" } },
      );
      assert.equal(view.status, 200);
      assert.equal(await milestone(), null);
      assert.equal((await send(read)).status, 204);
      const timestamp = await milestone();
      assert.ok(timestamp);
      assert.equal((await send(read)).status, 204);
      assert.equal(await milestone(), timestamp);
    } finally {
      await store.deleteWorkspace(owner, "DELETE", true);
      await store.deleteWorkspace(other, "DELETE", true);
      await pool.end();
    }
  },
);
