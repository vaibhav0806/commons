import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CodeChallengeMethod } from "google-auth-library";
import { googleClient, googleFlowCookie } from "@/lib/google-auth";
import { appUrl, validOrigin } from "@/lib/config";
import { currentParticipant } from "@/lib/session";
import { getStore } from "@/lib/db";

export async function GET(request: Request) {
  if (!validOrigin(request)) return new Response("Invalid origin", { status: 403 });
  if (await currentParticipant()) return NextResponse.redirect(new URL("/workspace", appUrl()));
  try {
    const client = googleClient();
    const state = randomBytes(32).toString("base64url");
    const nonce = randomBytes(32).toString("base64url");
    const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync();
    await getStore().beginGoogleSignIn(state, codeVerifier, nonce);
    (await cookies()).set(googleFlowCookie, state, {
      httpOnly: true, sameSite: "lax", secure: appUrl().protocol === "https:",
      path: "/auth/google", maxAge: 600,
    });
    const response = NextResponse.redirect(client.generateAuthUrl({
      scope: ["openid", "email", "profile"], state, nonce,
      code_challenge: codeChallenge, code_challenge_method: CodeChallengeMethod.S256,
      prompt: "select_account",
    }));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.redirect(new URL("/sign-in?error=google", appUrl()));
  }
}
