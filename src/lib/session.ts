import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getStore } from "./db";
import type { Principal } from "./store";
import { appUrl, allowedOrigins } from "./config";

export const sessionCookie = "commons_session";
export { appUrl } from "./config";
export async function allowMockSignIn() {
  const host = (await headers()).get("host");
  const url = appUrl();
  if (
    process.env.COMMONS_MOCK_AUTH !== "true" ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    ![...allowedOrigins()].some((o) => new URL(o).host === host)
  )
    throw new Error(
      "Local Google sign-in is available only on a configured loopback server.",
    );
}
export async function currentParticipant(): Promise<Principal | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return null;
  try {
    return await getStore().authenticate(token);
  } catch (error) {
    if (error instanceof Error && "status" in error && error.status === 401)
      return null;
    throw error;
  }
}
export async function requireParticipant() {
  const participant = await currentParticipant();
  if (!participant) redirect("/sign-in?session=ended");
  return participant;
}
export async function setSession(token: string, agent = false) {
  (await cookies()).set(sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: appUrl().protocol === "https:",
    path: "/",
    maxAge: (agent ? 90 : 30) * 86400,
  });
}
