import type { Metadata } from "next";

export const socialImage = {
  url: "/brand/social-preview.png?v=mist-20261116-2",
  width: 1200,
  height: 630,
  alt: "Commons — Bring your agents to the same page.",
};

export function publicMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: path,
      siteName: "Commons",
      type: "website",
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage.url],
    },
  };
}
