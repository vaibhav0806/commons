import assert from "node:assert/strict";
import { test } from "node:test";
import { Pool } from "pg";
import { Store, CommonsError } from "../src/lib/store";

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
const store = new Store(
  pool,
  "workspace-content-test-secret-at-least-32-characters",
);
test("rich pages enforce project scope, authorship, version checks, hierarchy and deletion", async () => {
  const owner = (
    await store.createLocalOwner(
      `pages-${crypto.randomUUID()}@example.test`,
      "Owner",
    )
  ).actor;
  const other = (
    await store.createLocalOwner(
      `other-${crypto.randomUUID()}@example.test`,
      "Other",
    )
  ).actor;
  const project = await store.createProject(
    owner,
    "Content",
    "A content workspace",
  );
  const hidden = await store.createProject(owner, "Private", "");
  const invite = await store.issueInvite(owner, project.id);
  const agent = (await store.join(invite.id, invite.code, "Page author")).actor;
  try {
    const page = await store.createPage(agent, project.id, {
      title: "Shared brief",
      body: "# Hello\n\n| Item | Value |\n|---|---|\n| A | B |",
      parentId: null,
    });
    assert.equal(
      (await store.getPage(owner, page.id)).authorName,
      "Page author",
    );
    await assert.rejects(store.getPage(other, page.id), CommonsError);
    await assert.rejects(
      store.createPage(agent, hidden.id, {
        title: "Hidden",
        body: "",
        parentId: null,
      }),
      CommonsError,
    );
    const privatePage = await store.createPage(owner, hidden.id, {
      title: "Private",
      body: "",
      parentId: null,
    });
    await assert.rejects(
      store.createPage(agent, project.id, {
        title: "Cross project",
        body: "",
        parentId: privatePage.id,
      }),
      CommonsError,
    );
    const child = await store.createPage(agent, project.id, {
      title: "Child",
      body: "",
      parentId: page.id,
    });
    await assert.rejects(
      store.updatePage(
        agent,
        page.id,
        { title: "Cycle", body: "", parentId: child.id },
        page.version,
      ),
      CommonsError,
    );
    const edited = await store.updatePage(
      owner,
      page.id,
      { title: "Shared brief", body: "Updated", parentId: null },
      page.version,
    );
    await assert.rejects(
      store.updatePage(
        agent,
        page.id,
        { title: "Stale", body: "Lost update", parentId: null },
        page.version,
      ),
      (e: unknown) => e instanceof CommonsError && e.status === 409,
    );
    assert.equal(
      (await store.searchProject(agent, project.id, "Shared brief")).some(
        (r) => r.kind === "page",
      ),
      true,
    );
    const ownerPage = await store.createPage(owner, project.id, {
      title: "Owner page",
      body: "",
      parentId: null,
    });
    await assert.rejects(
      store.updatePage(
        agent,
        ownerPage.id,
        { title: "Denied", body: "", parentId: null },
        ownerPage.version,
      ),
      CommonsError,
    );
    await store.deletePage(owner, page.id, edited.version);
    assert.equal((await store.getPage(owner, child.id)).parentId, null);
    await store.deleteProject(owner, project.id, project.name);
    await assert.rejects(store.getPage(agent, child.id), CommonsError);
  } finally {
    await store.deleteWorkspace(owner, "DELETE", true);
    await store.deleteWorkspace(other, "DELETE", true);
    await pool.end();
  }
});
