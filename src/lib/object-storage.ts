import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";
import { CommonsError, type Principal, type Store } from "./store";

function storage() {
  const { R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } =
    process.env;
  if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET)
    throw new CommonsError(
      "File storage is not configured. Ask the workspace host to configure R2.",
      503,
    );
  return {
    client: new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    }),
    bucket: R2_BUCKET,
  };
}
function imageType(bytes: Uint8Array) {
  const b = Buffer.from(bytes);
  if (b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    return "image/png";
  if (b[0] === 255 && b[1] === 216 && b[2] === 255) return "image/jpeg";
  if (["GIF87a", "GIF89a"].includes(b.subarray(0, 6).toString()))
    return "image/gif";
  if (
    b.subarray(0, 4).toString() === "RIFF" &&
    b.subarray(8, 12).toString() === "WEBP"
  )
    return "image/webp";
  return "application/octet-stream";
}
export async function uploadFile(
  store: Store,
  actor: Principal,
  projectId: string,
  name: string,
  bytes: Uint8Array,
) {
  if (bytes.byteLength > 16777216)
    throw new CommonsError("Each file can be up to 16 MB.", 413);
  const { client, bucket } = storage();
  const file = await store.reserveFile(actor, projectId, {
    name,
    size: bytes.byteLength,
    mimeType: imageType(bytes),
    checksum: createHash("sha256").update(bytes).digest("hex"),
  });
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: file.objectKey,
        Body: bytes,
        ContentType: file.mimeType,
      }),
    );
    return await store.completeFile(actor, file.id);
  } catch (error) {
    await store.deleteFile(actor, file.id).catch(() => {});
    // A deleted project or revoked registration must still leave a cleanup job.
    await store.queueFileCleanup(file.objectKey);
    throw error instanceof CommonsError
      ? error
      : new CommonsError(
          "The file could not be uploaded. Your original file is unchanged; try again.",
          503,
        );
  } finally {
    client.destroy();
  }
}
export async function readFileObject(objectKey: string) {
  const { client, bucket } = storage();
  try {
    const object = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: objectKey }),
    );
    if (!object.Body) throw new Error("Missing file body");
    return await object.Body.transformToByteArray();
  } catch {
    throw new CommonsError(
      "The original file is temporarily unavailable. Try again.",
      503,
    );
  } finally {
    client.destroy();
  }
}
export async function removeFileObject(objectKey: string) {
  const { client, bucket } = storage();
  const prefix = process.env.R2_PREFIX || "commons-files/";
  if (!objectKey.startsWith(prefix))
    throw new Error("Refusing to delete outside the file prefix.");
  try {
    await client.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }),
    );
  } finally {
    client.destroy();
  }
}
