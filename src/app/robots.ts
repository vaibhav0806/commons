import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/workspace",
        "/api/",
        "/mcp",
        "/auth/",
        "/join",
        "/return",
        "/connect",
        "/setup",
        "/start",
        "/sign-in",
      ],
    },
    sitemap: new URL("/sitemap.xml", appUrl()).href,
  };
}
