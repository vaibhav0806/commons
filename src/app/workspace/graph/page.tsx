import Link from "next/link";
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
        <h1>The context, connected.</h1>
        <p>Create a project to begin.</p>
      </div>
    );
  if (!projects.some((p) => p.id === selected)) notFound();
  const project = await store.getProject(actor, selected);
  const graph = await store.inspectGraph(actor, selected);
  return (
    <div
      className="project-page"
      style={{ maxWidth: 1200 }}
      data-workspace-background
    >
      <header className="project-heading">
        <div>
          <h1>The context, connected.</h1>
          <p>Explore shared material and authorship.</p>
        </div>
      </header>
      <nav aria-label="Graph projects" className="project-section">
        {projects.map((p) => (
          <Link
            key={p.id}
            className="button secondary"
            aria-current={p.id === selected ? "page" : undefined}
            href={`/workspace/graph?project=${p.id}`}
          >
            {p.name}
          </Link>
        ))}
      </nav>
      <section className="project-section">
        <h2>{project.name}</h2>
        <p className="meta">
          {!graph.available
            ? "The relationship service is unavailable. Content labels are still available."
            : graph.sync?.revision === graph.sync?.syncedRevision
              ? "Relationships are up to date."
              : "Sync pending. The graph may be behind your latest changes."}{" "}
          {graph.sync?.syncedAt
            ? `Last synced ${new Date(graph.sync.syncedAt).toLocaleString("en-GB", { timeZone: "UTC" })} UTC.`
            : ""}
        </p>
        {graph.sync?.lastError && <p role="status">{graph.sync.lastError}</p>}
        <GraphExplorer
          nodes={graph.nodes}
          edges={graph.edges}
          projectId={selected}
        />
        <p className="meta">
          Up to 200 records and 1,000 edges per relationship type. Select a
          record to inspect its connections. Historical authors remain visible after revocation.
        </p>
      </section>
    </div>
  );
}
