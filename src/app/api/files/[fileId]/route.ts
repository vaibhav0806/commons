import { getStore } from "@/lib/db";
import { validOrigin } from "@/lib/config";
import { fileActor, fileFailure } from "@/lib/file-http";
import { readFileObject } from "@/lib/object-storage";
import { CommonsError } from "@/lib/store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  try {
    const actor = await fileActor(request),
      { fileId } = await params,
      store = getStore();
    const file = await store.getFile(actor, fileId),
      bytes = await readFileObject(file.objectKey);
    // Recheck after storage I/O so a revoked session or deleted record is not served.
    await store.getFile(actor, fileId);
    const preview =
      new URL(request.url).searchParams.get("preview") === "1" &&
      ["image/png", "image/jpeg", "image/gif", "image/webp"].includes(
        file.mimeType,
      );
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": preview ? file.mimeType : "application/octet-stream",
        "Content-Length": String(bytes.length),
        "Content-Disposition": `${preview ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(file.name).replace(/'/g, "%27")}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (error) {
    return fileFailure(error);
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  try {
    if (!validOrigin(request))
      throw new CommonsError("Origin not allowed.", 403);
    const actor = await fileActor(request),
      { fileId } = await params;
    await getStore().deleteFile(actor, fileId);
    return Response.json(
      { deleted: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return fileFailure(error);
  }
}
