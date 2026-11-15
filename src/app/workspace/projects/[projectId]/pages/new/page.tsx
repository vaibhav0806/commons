import { randomUUID } from "node:crypto";
import { requireParticipant } from "@/lib/session";
import { getStore } from "@/lib/db";
import { ActionForm } from "@/components/forms";
import { PageEditor } from "@/components/page-editor";
import Link from "next/link";

export default async function NewPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ kind?: string; parent?: string; status?: string }>;
}) {
  const actor = await requireParticipant(),
    { projectId } = await params,
    store = getStore();
  await store.getProject(actor, projectId);
  const pages = await store.pageTree(actor, projectId);
  const query = await searchParams;
  const kind =
    query.kind === "folder" || query.kind === "collection" ? "folder" : "page";
  const parent = pages.find((page) => page.id === query.parent);
  const closeHref = `/workspace/projects/${projectId}${parent ? `/pages/${parent.id}` : ""}`;
  return (
    <div className="project-page document-page">
      <div className="document-toolbar creation-toolbar">
        {parent && (
          <Link className="text-link" href={closeHref}>
            {parent.title}
          </Link>
        )}
        <Link className="text-link" href={closeHref}>
          {kind === "page" ? "Back to project" : "Cancel"}
        </Link>
      </div>
      <div className="creation-form">
        {kind !== "page" && (
          <header className="project-heading">
            <div>
              <h1>New {kind}</h1>
            </div>
          </header>
        )}

        {kind === "page" ? (
          <PageEditor
            actorId={actor.id}
            pages={pages}
            parentId={parent?.id}
            status={
              query.status === "Drafting" || query.status === "Ready"
                ? query.status
                : "Idea"
            }
            projectId={projectId}
            files={(await store.listFiles(actor, projectId)).files}
          />
        ) : (
          <ActionForm
            className="form-stack"
            operation="page"
            projectId={projectId}
            label={`Create ${kind}`}
          >
            <input name="clientKey" type="hidden" value={randomUUID()} />
            <PageEditor
              pages={pages}
              kind={kind}
              parentId={parent?.id}
              projectId={projectId}
              files={[]}
            />
          </ActionForm>
        )}
      </div>
    </div>
  );
}
