import { z } from "zod";
import { currentParticipant } from "@/lib/session";
import { getStore } from "@/lib/db";
import { CommonsError } from "@/lib/store";

export async function GET(request: Request) {
  const actor = await currentParticipant();
  if (!actor)
    return Response.json({ error: "Sign in to search." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const input = z
    .object({ projectId: z.uuid(), query: z.string().max(200) })
    .safeParse({
      projectId: params.get("projectId"),
      query: params.get("q") || "",
    });
  if (!input.success)
    return Response.json(
      { error: "Choose a project and a search of at most 200 characters." },
      { status: 400 },
    );
  try {
    return Response.json(
      {
        results: await getStore().searchProject(
          actor,
          input.data.projectId,
          input.data.query,
        ),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof CommonsError)
      return Response.json({ error: error.message }, { status: error.status });
    return Response.json(
      { error: "Search is unavailable. Try again." },
      { status: 500 },
    );
  }
}
