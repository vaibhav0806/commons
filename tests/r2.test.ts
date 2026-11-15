import assert from "node:assert/strict";
import { test } from "node:test";
import { Pool } from "pg";
import { Store, CommonsError } from "../src/lib/store";
import {
  uploadFile,
  readFileObject,
  removeFileObject,
} from "../src/lib/object-storage";

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
const store = new Store(
  pool,
  "r2-test-secret-that-is-over-thirty-two-characters",
);
test("private R2 bytes round-trip, survive metadata reads and lose access on revocation", async () => {
  assert.ok(
    process.env.R2_BUCKET,
    "Configure real private R2 storage for this test",
  );
  const owner = (
    await store.createLocalOwner(
      `r2-${crypto.randomUUID()}@example.test`,
      "R2 Owner",
    )
  ).actor;
  const project = await store.createProject(
    owner,
    "R2 fixture",
    "Disposable storage verification",
  );
  const invite = await store.issueInvite(owner, project.id),
    joined = await store.join(invite.id, invite.code, "R2 agent");
  let key: string | undefined;
  try {
    const body = Buffer.from("# Shared context\n\nDurable private R2 bytes.\n");
    const file = await uploadFile(
      store,
      joined.actor,
      project.id,
      "context.md",
      body,
    );
    key = file.objectKey;
    assert.deepEqual(Buffer.from(await readFileObject(file.objectKey)), body);
    assert.equal(
      (await store.listFiles(owner, project.id)).files[0].id,
      file.id,
    );
    await store.revoke(owner, joined.actor.id);
    await assert.rejects(store.getFile(joined.actor, file.id), CommonsError);
    assert.equal((await store.getFile(owner, file.id)).authorName, "R2 agent");
    await store.deleteFile(owner, file.id);
    await assert.rejects(store.getFile(owner, file.id), CommonsError);
    await removeFileObject(key);
    await assert.rejects(readFileObject(key), CommonsError);
  } finally {
    if (key) await removeFileObject(key);
    await store.deleteWorkspace(owner, "DELETE", true);
    await pool.end();
  }
});
