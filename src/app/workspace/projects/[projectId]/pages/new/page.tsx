import { randomUUID } from "node:crypto";
import { requireParticipant } from "@/lib/session";
import { getStore } from "@/lib/db";
import { ActionForm } from "@/components/forms";
import { PageEditor } from "@/components/page-editor";
import { DetailSheet } from "@/components/detail-sheet";

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
  const project = await store.getProject(actor, projectId),
    pages = await store.pageTree(actor, projectId);
  const query = await searchParams;
  const kind =
    query.kind === "folder" || query.kind === "collection"
      ? query.kind
      : "page";
  const parent = pages.find((page) => page.id === query.parent);
  const closeHref = `/workspace/projects/${projectId}${parent ? `/pages/${parent.id}` : ""}`;
  return (
    <DetailSheet closeHref={closeHref} title={`New ${kind}`}>
      <div className="creation-form">
        <header className="project-heading">
          <div>
            <h1>New {kind}</h1>
            <p>
              Inside {project.name}
              {parent ? ` / ${parent.title}` : ""}
            </p>
          </div>
        </header>

        <ActionForm
          operation="page"
          projectId={projectId}
          label={kind === "page" ? "Save page" : `Create ${kind}`}
        >
          <input name="clientKey" type="hidden" value={randomUUID()} />
          <PageEditor
            pages={pages}
            kind={kind}
            parentId={parent?.id}
            status={
              query.status === "Drafting" || query.status === "Ready"
                ? query.status
                : "Idea"
            }
            projectId={projectId}
            files={(await store.listFiles(actor, projectId)).files}
          />
        </ActionForm>
      </div>
    </DetailSheet>
  );
}
