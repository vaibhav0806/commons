import assert from "node:assert/strict";
import { test } from "node:test";
import { Pool } from "pg";
import { Store, CommonsError } from "../src/lib/store";

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
const store = new Store(pool, "files-test-secret-that-is-over-32-characters");
test("file metadata is scoped, hidden until uploaded, author-managed and queued for cleanup", async () => {
  const owner = (
    await store.createLocalOwner(
      `files-${crypto.randomUUID()}@example.test`,
      "Owner",
    )
  ).actor;
  const other = (
    await store.createLocalOwner(
      `other-${crypto.randomUUID()}@example.test`,
      "Other",
    )
  ).actor;
  const project = await store.createProject(owner, "Files", "");
  const invite = await store.issueInvite(owner, project.id),
    agent = (await store.join(invite.id, invite.code, "Uploader")).actor;
  try {
    const file = await store.reserveFile(agent, project.id, {
      name: "brief.md",
      size: 5,
      mimeType: "text/markdown",
      checksum: "a".repeat(64),
    });
    assert.equal((await store.listFiles(owner, project.id)).files.length, 0);
    await assert.rejects(store.getFile(other, file.id), CommonsError);
    await store.completeFile(agent, file.id);
    assert.equal((await store.getFile(owner, file.id)).name, "brief.md");
    const ownerFile = await store.reserveFile(owner, project.id, {
      name: "owner.md",
      size: 4,
      mimeType: "text/plain",
      checksum: "b".repeat(64),
    });
    await store.completeFile(owner, ownerFile.id);
    await assert.rejects(store.deleteFile(agent, ownerFile.id), CommonsError);
    await store.deleteFile(agent, file.id);
    await assert.rejects(store.getFile(owner, file.id), CommonsError);
    assert.equal(
      (
        await pool.query("SELECT 1 FROM file_cleanup WHERE object_key=$1", [
          file.objectKey,
        ])
      ).rowCount,
      1,
    );
    await store.deleteProject(owner, project.id, project.name);
    assert.equal(
      (
        await pool.query("SELECT 1 FROM file_cleanup WHERE object_key=$1", [
          ownerFile.objectKey,
        ])
      ).rowCount,
      1,
    );
    await assert.rejects(store.getFile(agent, ownerFile.id), CommonsError);
  } finally {
    await store.deleteWorkspace(owner, "DELETE", true);
    await store.deleteWorkspace(other, "DELETE", true);
    await pool.end();
  }
});
