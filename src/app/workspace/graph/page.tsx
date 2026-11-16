import { notFound } from "next/navigation";
import { requireParticipant } from "@/lib/session";
import { getStore } from "@/lib/db";
import { GraphExplorer } from "@/components/graph-explorer";

export default async function GraphPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const actor = await requireParticipant();
  if (actor.kind !== "owner") notFound();
  const store = getStore();
  const projects = await store.listProjects(actor);
  const selected = (await searchParams).project || projects[0]?.id;
  if (!selected)
    return (
      <div className="project-page">
        <header className="project-heading">
          <div>
            <h1>Explorer</h1>
            <p>Create a project to begin.</p>
          </div>
        </header>
      </div>
    );
  if (!projects.some((p) => p.id === selected)) notFound();
  const graph = await store.inspectGraph(actor, selected);
  return (
    <div
      className="project-page"
      style={{ maxWidth: 1200 }}
      data-workspace-background
    >
      <header className="project-heading">
        <div>
          <h1>Explorer</h1>
          <p>Follow the sources. Find what connects.</p>
        </div>
      </header>
      <section className="project-section">
        <GraphExplorer
          key={selected}
          projects={projects}
          ready={
            graph.available &&
            !!graph.sync &&
            graph.sync.revision === graph.sync.syncedRevision
          }
          available={graph.available}
          truncated={graph.truncated}
          syncedAt={graph.sync?.syncedAt}
          nodes={graph.nodes}
          edges={graph.edges}
          projectId={selected}
        />
      </section>
    </div>
  );
}
