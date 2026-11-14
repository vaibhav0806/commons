import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireParticipant } from "@/lib/session";
import { getStore } from "@/lib/db";
import { Icon } from "@/components/brand";
import { ProjectTabs } from "@/components/project-tabs";

export default async function Pages({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ q?: string; offset?: string }>;
}) {
  const actor = await requireParticipant(),
    { projectId } = await params,
    query = await searchParams,
    store = getStore();
  if (!z.uuid().safeParse(projectId).success) notFound();
  const project = await store.getProject(actor, projectId);
  const result = await store.listPages(actor, projectId, {
    query: (query.q || "").slice(0, 200),
    offset: Math.max(0, Math.min(1000000, Number(query.offset) || 0)),
  });
  const base = `/workspace/projects/${projectId}/pages`;
  return (
    <div className="project-page">
      <header className="project-heading">
        <div>
          <h1>Project pages</h1>
          <p>
            A place for the brief, the thinking and everything that follows.
          </p>
        </div>
        <Link className="button" href={`${base}/new`}>
          <Icon name="Plus" />
          New page
        </Link>
      </header>
      <ProjectTabs projectId={projectId} active="Pages" />
      <form className="project-search">
        <Icon name="MagnifyingGlass" />
        <input
          name="q"
          aria-label="Find a page"
          placeholder="Find a page…"
          defaultValue={query.q}
          maxLength={200}
        />
        <button className="text-link">Search</button>
      </form>
      <div className="context-list">
        {result.pages.map((page) => (
          <Link
            key={page.id}
            className={`context-row ${page.parentId ? "nested-page" : ""}`}
            href={`${base}/${page.id}`}
          >
            <Icon name="FileText" />
            <div className="row-copy">
              <h3>{page.title}</h3>
              <p>
                {page.parentId
                  ? `Inside ${result.pages.find((p) => p.id === page.parentId)?.title || "another page"}`
                  : project.name}
              </p>
            </div>
            <span className="meta">{page.authorName}</span>
            <time className="meta">
              {new Date(page.editedAt || page.createdAt).toLocaleDateString(
                "en-GB",
                { day: "numeric", month: "short" },
              )}
            </time>
            <Icon name="CaretRight" />
          </Link>
        ))}
        {!result.pages.length && (
          <div className="empty-state">
            <Icon name="FileText" />
            <h2>
              {query.q ? "No pages match that search." : "Start with a page."}
            </h2>
            <p>Write a brief or import the Markdown you already have.</p>
            <Link className="button" href={`${base}/new`}>
              Create a page
            </Link>
          </div>
        )}
      </div>
      {result.nextOffset !== null && (
        <Link
          className="show-more"
          href={`${base}?q=${encodeURIComponent(query.q || "")}&offset=${result.nextOffset}`}
        >
          More pages
        </Link>
      )}
    </div>
  );
}
