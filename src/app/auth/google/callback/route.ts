import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { googleClient, googleFlowCookie } from "@/lib/google-auth";
import { appUrl } from "@/lib/config";
import { currentParticipant, setSession } from "@/lib/session";
import { getStore } from "@/lib/db";

export async function GET(request: Request) {
  const jar = await cookies();
  const saved = jar.get(googleFlowCookie)?.value;
  jar.set(googleFlowCookie, "", { path: "/auth/google", maxAge: 0 });
  let destination = "/sign-in?error=google";
  try {
    const query = new URL(request.url).searchParams;
    const state = query.get("state"), code = query.get("code");
    if (!saved || !state || saved.length !== state.length ||
        !timingSafeEqual(Buffer.from(saved), Buffer.from(state))) throw new Error("Invalid state");
    const flow = await getStore().consumeGoogleSignIn(state);
    if (!code || code.length > 4096 || query.has("error")) throw new Error("Sign-in declined");
    if (await currentParticipant()) {
      destination = "/workspace";
    } else {
      const client = googleClient();
      const { tokens } = await client.getToken({ code, codeVerifier: flow.verifier });
      if (!tokens.id_token) throw new Error("Missing identity");
      const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: process.env.GOOGLE_CLIENT_ID });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email || payload.email_verified !== true ||
          (payload as typeof payload & { nonce?: string }).nonce !== flow.nonce) throw new Error("Invalid identity");
      const result = await getStore().signInGoogle(payload.sub, payload.email, payload.name || "Workspace owner");
      await setSession(result.token);
      destination = (await getStore().listProjects(result.actor)).length ? "/workspace" : "/setup";
    }
  } catch {
    console.error("Google sign-in did not complete.");
  }
  const response = NextResponse.redirect(new URL(destination, appUrl()));
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
