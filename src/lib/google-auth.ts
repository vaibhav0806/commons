import { OAuth2Client } from "google-auth-library";
import { appUrl } from "./config";

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
export function googleClient() {
  if (!googleConfigured()) throw new Error("Google sign-in is not configured.");
  return new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: new URL("/auth/google/callback", appUrl()).href,
  });
}
export const googleFlowCookie = "commons_google_state";
