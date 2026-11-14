import Link from "next/link";
import { notFound } from "next/navigation";
import { requireParticipant } from "@/lib/session";
import { getStore } from "@/lib/db";
import { CommonsError } from "@/lib/store";
import { AgentMark } from "@/components/brand";
import { ActionForm, CopyButton } from "@/components/forms";
import { MarkdownContent } from "@/components/markdown";
import { PageEditor } from "@/components/page-editor";
import { ProjectTabs } from "@/components/project-tabs";
import { appUrl } from "@/lib/config";

export default async function PageDocument({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string; pageId: string }>;
  searchParams: Promise<{ edit?: string; delete?: string }>;
}) {
  const actor = await requireParticipant(),
    { projectId, pageId } = await params,
    query = await searchParams,
    store = getStore();
  const page = await store.getPage(actor, pageId).catch((error) => {
    if (error instanceof CommonsError) notFound();
    throw error;
  });
  if (page.projectId !== projectId) notFound();
  const canEdit = actor.kind === "owner" || actor.id === page.authorId;
  if ((query.edit || query.delete) && !canEdit) notFound();
  const base = `/workspace/projects/${projectId}/pages/${pageId}`;
  const children = (await store.listPages(actor, projectId)).pages.filter(
    (p) => p.parentId === pageId,
  );
  return (
    <div className="project-page document-page">
      <div className="document-toolbar">
        <Link
          className="text-link"
          href={`/workspace/projects/${projectId}/pages`}
        >
          Project pages
        </Link>
        <div className="document-actions">
          <CopyButton
            text={`${appUrl().origin}${base}`}
            label="Copy page link"
          />
          {canEdit && !query.edit && (
            <Link className="button" href={`${base}?edit=1`}>
              Edit page
            </Link>
          )}
          {query.edit && (
            <Link className="button secondary" href={base}>
              Cancel editing
            </Link>
          )}
        </div>
      </div>
      <header className="document-heading">
        <h1>{query.edit ? "Edit page" : page.title}</h1>
        <div className="document-byline">
          <AgentMark name={page.authorName} small />
          <span>
            {page.authorName} · {page.editedAt ? "Updated" : "Created"}{" "}
            {new Date(page.editedAt || page.createdAt).toLocaleString("en-GB")}
          </span>
        </div>
      </header>
      <ProjectTabs projectId={projectId} active="Pages" />
      {query.delete ? (
        <section className="project-section">
          <h2>Delete this page?</h2>
          <p>
            Its child pages stay in the project at the top level. Linked files
            stay in the file library.
          </p>
          <ActionForm operation="delete-page" label="Delete page" danger>
            <input type="hidden" name="pageId" value={page.id} />
            <input type="hidden" name="version" value={page.version} />
          </ActionForm>
          <Link className="text-link" href={base}>
            Keep page
          </Link>
        </section>
      ) : query.edit ? (
        <ActionForm operation="edit-page" label="Save page">
          <input type="hidden" name="pageId" value={page.id} />
          <input type="hidden" name="version" value={page.version} />
          <PageEditor
            page={page}
            projectId={projectId}
            files={(await store.listFiles(actor, projectId)).files}
            pages={(await store.listPages(actor, projectId)).pages}
          />
        </ActionForm>
      ) : (
        <>
          <MarkdownContent
            body={page.body || "This page is ready for its first content."}
          />
          {!!children.length && (
            <section className="project-section">
              <h2>Inside this page</h2>
              {children.map((child) => (
                <Link
                  className="context-row"
                  key={child.id}
                  href={`/workspace/projects/${projectId}/pages/${child.id}`}
                >
                  {child.title}
                </Link>
              ))}
            </section>
          )}
          {canEdit && (
            <div className="document-end-actions">
              <Link className="text-link danger-text" href={`${base}?delete=1`}>
                Delete page…
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
