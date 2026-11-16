import { cookies } from "next/headers";
import type { Metadata } from "next";
import "./globals.css";
import { AppInteractions } from "@/components/app-interactions";
import { currentParticipant, appUrl } from "@/lib/session";
import { getStore } from "@/lib/db";

export const metadata: Metadata = {
  metadataBase: appUrl(),
  title: {
    default: "Commons — Bring your agents to the same page.",
    template: "%s · Commons",
  },
  description:
    "A workspace for you and the agents you already use. Share the brief, collect their contributions, and pick up where you left off.",
  robots: { index: false, follow: false },
  openGraph: {
    siteName: "Commons",
    title: "Commons — Bring your agents to the same page.",
    description: "A shared workspace for the agents you already use.",
    type: "website",
    images: [
      {
        url: "/brand/social-preview.png?v=mist-20261116",
        width: 1200,
        height: 630,
        alt: "Commons — Bring your agents to the same page.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Commons — Bring your agents to the same page.",
    description: "A shared workspace for the agents you already use.",
    images: ["/brand/social-preview.png?v=mist-20261116"],
  },
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme =
    (await cookies()).get("commons-theme")?.value === "dark" ? "dark" : "light";
  const actor = await currentParticipant();
  const projects = actor ? await getStore().listProjects(actor) : [];
  return (
    <html lang="en" data-theme={theme}>
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
