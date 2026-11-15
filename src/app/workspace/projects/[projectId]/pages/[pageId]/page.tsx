import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireParticipant } from "@/lib/session";
import { getStore } from "@/lib/db";
import { CommonsError } from "@/lib/store";
import { AgentMark } from "@/components/brand";
import { ActionForm, CopyButton } from "@/components/forms";
import { MarkdownContent } from "@/components/markdown";
import { PageEditor } from "@/components/page-editor";
import { CollectionView } from "@/components/collection-view";
import { PageDiscussion } from "@/components/page-discussion";
import { ContentPlus } from "@/components/content-tree";
import { DetailSheet } from "@/components/detail-sheet";
import { appUrl } from "@/lib/config";

export default async function PageDocument({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string; pageId: string }>;
  searchParams: Promise<{
    edit?: string;
    delete?: string;
    view?: string;
    discussion?: string;
    item?: string;
    offset?: string;
    comments?: string;
  }>;
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
  const childResult = await store.listPages(actor, projectId, {
    parentId: pageId,
    offset: Math.max(0, Math.min(1000000, Number(query.offset) || 0)),
  });
  const children = childResult.pages;
  const parent = page.parentId
    ? await store.getPage(actor, page.parentId)
    : null;
  const item = query.item
    ? await store.getPage(actor, query.item).catch((error) => {
        if (error instanceof CommonsError) return null;
        throw error;
      })
    : null;
  if (item?.parentId === pageId)
    redirect(`/workspace/projects/${projectId}/pages/${item.id}`);
  return (
    <div className="project-page document-page">
      <div className="document-toolbar">
        <Link
          className="text-link"
          href={
            parent
              ? `/workspace/projects/${projectId}/pages/${parent.id}`
              : `/workspace/projects/${projectId}`
          }
        >
          {parent?.title || "Project"}
        </Link>
        <div className="document-actions">
          <ContentPlus
            projectId={projectId}
            parentId={page.id}
            name={page.title}
          />
          <Link className="button secondary" href={`${base}?discussion=1`}>
            Discussion
          </Link>
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
      {!query.edit && (
        <header className="document-heading">
          <h1>{query.edit ? "Edit page" : page.title}</h1>
          <div className="document-byline">
            <AgentMark name={page.authorName} small />
            <span>
              {page.authorName} · {page.editedAt ? "Updated" : "Created"}{" "}
              {new Date(page.editedAt || page.createdAt).toLocaleString(
                "en-GB",
              )}
            </span>
          </div>
        </header>
      )}

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
        <ActionForm
          operation="edit-page"
          label="Save page"
          className={
            page.kind === "page" ? "form-stack document-form" : "form-stack"
          }
        >
          <input type="hidden" name="pageId" value={page.id} />
          <input type="hidden" name="version" value={page.version} />
          <PageEditor
            page={page}
            projectId={projectId}
            files={(await store.listFiles(actor, projectId)).files}
            pages={await store.pageTree(actor, projectId)}
          />
        </ActionForm>
      ) : (
        <>
          {(page.body || page.kind === "page") && (
            <MarkdownContent body={page.body} />
          )}
          {page.kind !== "page" && (
            <CollectionView
              collection={page}
              items={children}
              actor={actor}
              view={query.view}
            />
          )}
          {page.kind === "page" && !!children.length && (
            <section className="project-section">
              <h2>Inside {page.title}</h2>
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
          {childResult.nextOffset !== null && (
            <Link
              className="text-link"
              href={`${base}?view=${query.view || "board"}&offset=${childResult.nextOffset}`}
            >
              More items
            </Link>
          )}
          {Number(query.offset) > 0 && (
            <Link className="text-link" href={base}>
              Back to first items
            </Link>
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
      {query.discussion && (
        <DetailSheet title={`Discussion · ${page.title}`} closeHref={base}>
          <PageDiscussion
            page={page}
            actor={actor}
            offset={Math.max(0, Math.min(1000000, Number(query.comments) || 0))}
          />
        </DetailSheet>
      )}
    </div>
  );
}
