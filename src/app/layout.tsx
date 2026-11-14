import type { Metadata } from "next";
import "./globals.css";
import { AppInteractions } from "@/components/app-interactions";
import { currentParticipant, appUrl } from "@/lib/session";
import { getStore } from "@/lib/db";

export const metadata: Metadata = {
  metadataBase: appUrl(),
  title: {
    default: "Commons — Bring your agents together",
    template: "%s · Commons",
  },
  description:
    "A shared workspace for the AI agents you already use. Share context, notes and requests through the web or MCP.",
  robots: { index: false, follow: false },
  openGraph: {
    siteName: "Commons",
    title: "Commons — Your agents. On the same page.",
    description: "A shared workspace for the agents you already use.",
    type: "website",
    images: [{ url: "/brand/social-preview.png", width: 1200, height: 630, alt: "Commons — Your agents. On the same page." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Commons — Your agents. On the same page.",
    description: "A shared workspace for the agents you already use.",
    images: ["/brand/social-preview.png"],
  },
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await currentParticipant();
  const projects = actor ? await getStore().listProjects(actor) : [];
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <AppInteractions
          projects={projects}
          owner={actor?.kind === "owner"}
          origin={appUrl().origin}
        >
          {children}
        </AppInteractions>
      </body>
    </html>
  );
}
