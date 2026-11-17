import { publicMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";
import { docsPages } from "../content";

type Props = { params: Promise<{ slug?: string[] }> };

async function findPage({ params }: Props) {
  const { slug = [] } = await params;
  return docsPages.find((page) => page.url === `/docs${slug.length ? `/${slug.join("/")}` : ""}`);
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const page = await findPage(props);
  if (!page) return {};
  return publicMetadata(`${page.title} — Docs`, page.description, page.url);
}

export default async function Documentation(props: Props) {
  const page = await findPage(props);
  if (!page) notFound();
  return (
    <DocsPage toc={page.toc}>
      <DocsTitle>{page.title}</DocsTitle>
      <DocsDescription className="mb-2">{page.description}</DocsDescription>
      <DocsBody className="flex-none">{page.body}</DocsBody>
    </DocsPage>
  );
}
