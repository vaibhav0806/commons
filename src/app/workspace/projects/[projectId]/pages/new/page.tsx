import { randomUUID } from "node:crypto";
import { requireParticipant } from "@/lib/session";
import { getStore } from "@/lib/db";
import { ActionForm } from "@/components/forms";
import { PageEditor } from "@/components/page-editor";
import { ProjectTabs } from "@/components/project-tabs";

export default async function NewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const actor = await requireParticipant(),
    { projectId } = await params,
    store = getStore();
  const project = await store.getProject(actor, projectId),
    pages = await store.listPages(actor, projectId);
  return (
    <div className="project-page document-page">
      <header className="project-heading">
        <div>
          <h1>New page</h1>
          <p>{project.name}</p>
        </div>
      </header>
      <ProjectTabs projectId={projectId} active="Pages" />
      <ActionForm operation="page" projectId={projectId} label="Save page">
        <input name="clientKey" type="hidden" value={randomUUID()} />
        <PageEditor pages={pages.pages} />
      </ActionForm>
    </div>
  );
}
