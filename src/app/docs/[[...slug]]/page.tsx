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
  return { title: `${page.title} — Docs`, description: page.description, alternates: { canonical: page.url }, robots: { index: true, follow: true } };
}

export default async function Documentation(props: Props) {
  const page = await findPage(props);
  if (!page) notFound();
  return (
    <DocsPage toc={page.toc}>
      <DocsTitle>{page.title}</DocsTitle>
      <DocsDescription>{page.description}</DocsDescription>
      <DocsBody>{page.body}</DocsBody>
    </DocsPage>
  );
}
