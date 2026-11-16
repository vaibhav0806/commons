import { getStore } from "@/lib/db";
import { validOrigin } from "@/lib/config";
import { fileActor, fileFailure } from "@/lib/file-http";
import { uploadFile } from "@/lib/object-storage";
import { CommonsError } from "@/lib/store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    if (!validOrigin(request))
      throw new CommonsError("Origin not allowed.", 403);
    const actor = await fileActor(request),
      { projectId } = await params,
      store = getStore();
    await store.getProject(actor, projectId);
    const limit = 16777216 + 131072;
    if (Number(request.headers.get("content-length")) > limit)
      throw new CommonsError("Each file can be up to 16 MB.", 413);
    if (!request.body) throw new CommonsError("Choose a file to upload.");
    let size = 0;
    const capped = request.body.pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          size += chunk.byteLength;
          if (size > limit)
            throw new CommonsError("Each file can be up to 16 MB.", 413);
          controller.enqueue(chunk);
        },
      }),
    );
    const data = await new Response(capped, {
      headers: { "Content-Type": request.headers.get("content-type") || "" },
    }).formData();
    const file = data.get("file");
    if (!(file instanceof File))
      throw new CommonsError("Choose a file to upload.");
    const saved = await uploadFile(
      store,
      actor,
      projectId,
      file.name,
      new Uint8Array(await file.arrayBuffer()),
    );
    return Response.json(
      {
        id: saved.id,
        name: saved.name,
        mimeType: saved.mimeType,
        projectId,
        url: `/api/files/${saved.id}`,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return fileFailure(error);
  }
}
