import { z } from "zod";
import { currentParticipant } from "./session";
import { getStore } from "./db";
import { CommonsError } from "./store";

export async function fileActor(request: Request) {
  const bearer = request.headers
    .get("authorization")
    ?.match(/^Bearer ([A-Za-z0-9_-]+)$/)?.[1];
  const actor = bearer
    ? await getStore().authenticate(bearer)
    : await currentParticipant();
  if (!actor)
    throw new CommonsError("Sign in or connect an agent to access files.", 401);
  return actor;
}
export function fileFailure(error: unknown) {
  return Response.json(
    {
      error:
        error instanceof CommonsError
          ? error.message
          : error instanceof z.ZodError
            ? error.issues[0]?.message
            : "The file operation failed. Try again.",
    },
    {
      status:
        error instanceof CommonsError
          ? error.status
          : error instanceof z.ZodError
            ? 400
            : 500,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
