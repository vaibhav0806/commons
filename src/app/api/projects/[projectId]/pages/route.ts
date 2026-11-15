import { z } from "zod";
import { getStore } from "@/lib/db";
import { currentParticipant } from "@/lib/session";
import { validOrigin } from "@/lib/config";
import { CommonsError } from "@/lib/store";

const draftSchema = z.object({
  id: z.uuid().nullable(),
  version: z.number().int().positive().nullable(),
  clientKey: z.uuid(),
  draft: z.object({
    title: z
      .string()
      .trim()
      .max(160)
      .transform((value) => value || "Untitled page"),
    body: z.string().max(100000),
    parentId: z.uuid().nullable(),
    status: z.enum(["Idea", "Drafting", "Ready"]),
  }),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    if (!validOrigin(request))
      throw new CommonsError("Origin not allowed.", 403);
    const actor = await currentParticipant();
    if (!actor)
      throw new CommonsError(
        "Your session ended. Sign in again before saving.",
        401,
      );
    const { projectId } = await params,
      store = getStore();
    await store.getProject(actor, projectId);
    if (!request.body) throw new CommonsError("A page draft is required.");
    let size = 0;
    const capped = request.body.pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          size += chunk.byteLength;
          if (size > 650000)
            throw new CommonsError("This page is too large to save.", 413);
          controller.enqueue(chunk);
        },
      }),
    );
    const input = draftSchema.parse(await new Response(capped).json());
    let page;
    if (input.id) {
      const current = await store.getPage(actor, input.id);
      if (current.projectId !== projectId || current.kind !== "page")
        throw new CommonsError("Page not found.", 404);
      if (actor.kind !== "owner" && current.authorId !== actor.id)
        throw new CommonsError(
          "Only the author or workspace owner can edit this page.",
          403,
        );
      // A lost response can be retried without creating another revision.
      const unchanged =
        current.title === input.draft.title &&
        current.body === input.draft.body &&
        current.parentId === input.draft.parentId &&
        current.status === input.draft.status;
      page = unchanged
        ? current
        : await store.updatePage(
            actor,
            input.id,
            input.draft,
            input.version || 0,
          );
    } else {
      page = await store.createPage(
        actor,
        projectId,
        { ...input.draft, kind: "page" },
        input.clientKey,
      );
    }
    return Response.json(
      { page },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof CommonsError
            ? error.message
            : error instanceof z.ZodError
              ? error.issues[0]?.message
              : "Couldn’t save this page. Try again.",
      },
      {
        status:
          error instanceof CommonsError
            ? error.status
            : error instanceof z.ZodError || error instanceof SyntaxError
              ? 400
              : 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
