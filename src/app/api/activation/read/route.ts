import { z } from "zod";
import { currentParticipant } from "@/lib/session";
import { validOrigin } from "@/lib/config";
import { getStore } from "@/lib/db";
import { CommonsError } from "@/lib/store";

const schema = z
  .object({ type: z.enum(["page", "project"]), id: z.uuid() })
  .strict();

export async function POST(request: Request) {
  try {
    if (!validOrigin(request))
      throw new CommonsError("Origin not allowed.", 403);
    const actor = await currentParticipant();
    if (!actor) throw new CommonsError("Sign in first.", 401);
    const resource = schema.parse(await request.json());
    await getStore().recordContextRead(actor, resource);
    return new Response(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const status =
      error instanceof CommonsError
        ? error.status
        : error instanceof z.ZodError || error instanceof SyntaxError
          ? 400
          : 500;
    return Response.json(
      { error: "Could not record context read." },
      {
        status,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
