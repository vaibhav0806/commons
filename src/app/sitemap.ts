import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/config";
import { docsPages } from "./docs/content";

// Resolve the deployment origin at request time, not during the Docker build.
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/privacy", ...docsPages.map((page) => page.url)].map(
    (path) => ({
      url: new URL(path, appUrl()).href,
    }),
  );
}
