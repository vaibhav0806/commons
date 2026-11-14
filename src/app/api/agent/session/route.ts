import { cookies } from "next/headers";
import { validOrigin } from "@/lib/config";
import { currentParticipant, sessionCookie, setSession } from "@/lib/session";

export async function POST(request: Request) {
  if (!request.headers.get("origin") || !validOrigin(request))
    return new Response(null, { status: 403 });
  const actor = await currentParticipant();
  if (!actor || actor.kind !== "agent")
    return new Response(null, { status: 401 });
  const token = (await cookies()).get(sessionCookie)!.value;
  await setSession(token, true);
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
