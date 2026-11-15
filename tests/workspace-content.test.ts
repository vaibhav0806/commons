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
    const folder = await store.createPage(owner, project.id, { title: "Editorial", body: "", parentId: null, kind: "folder" });
    const collection = await store.createPage(owner, project.id, { title: "First issue", body: "", parentId: folder.id, kind: "collection" });
    const item = await store.createPage(agent, project.id, { title: "Opening", body: "Three ideas", parentId: collection.id, status: "Drafting" });
    assert.equal((await store.listPages(agent, project.id, { parentId: folder.id })).pages[0].id, collection.id);
    assert.equal((await store.listPages(agent, project.id, { parentId: collection.id })).pages[0].status, "Drafting");
    assert.equal((await store.pageTree(agent, project.id)).find(p => p.id === collection.id)?.kind, "collection");
    await assert.rejects(store.pageTree(agent, hidden.id), CommonsError);
    const compatible = await store.updatePage(owner, collection.id, { title: "Issue one", body: "", parentId: folder.id }, collection.version);
    assert.equal(compatible.kind, "collection", "old clients preserve the content kind");
    const moved = await store.updatePage(agent, item.id, { title: item.title, body: item.body, parentId: collection.id, status: "Ready" }, item.version);
    assert.equal(moved.status, "Ready");
    await assert.rejects(store.updatePage(agent, item.id, { title: item.title, body: item.body, parentId: collection.id, status: "Idea" }, item.version), e => e instanceof CommonsError && e.status === 409);
    const key = crypto.randomUUID();
    const comment = await store.createComment(agent, ownerPage.id, "Keep the sources beside the claims.", key);
    assert.equal((await store.createComment(agent, ownerPage.id, "Retry", key)).id, comment.id);
    await assert.rejects(store.createComment(agent, item.id, "Wrong retry", key), e => e instanceof CommonsError && e.status === 409);
    await assert.rejects(store.listComments(other, ownerPage.id), CommonsError);
    await assert.rejects(store.createComment(agent, privatePage.id, "Denied", crypto.randomUUID()), CommonsError);
    const ownerComment = await store.createComment(owner, ownerPage.id, "Agreed", crypto.randomUUID());
    await assert.rejects(store.deleteComment(agent, ownerComment.id), e => e instanceof CommonsError && e.status === 403);
    assert.equal((await store.listComments(owner, ownerPage.id)).comments.length, 2);
    await store.deleteComment(owner, comment.id);
    assert.equal((await store.listComments(agent, ownerPage.id)).comments.length, 1);
    await store.createComment(agent, item.id, "Temporary", crypto.randomUUID());
    await store.deletePage(agent, item.id, moved.version);
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM page_comments WHERE page_id=$1", [item.id])).rows[0].n, 0);
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
