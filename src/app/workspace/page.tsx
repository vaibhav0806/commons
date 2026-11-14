import Link from "next/link";
import { requireParticipant } from "@/lib/session";
import { getStore } from "@/lib/db";
import { AgentMark, Icon } from "@/components/brand";

export default async function Workspace() {
  const actor = await requireParticipant(),
    store = getStore();
  const projects = await store.listProjects(actor);
  const summaries = await Promise.all(
    projects.map(async (project) => ({
      project,
      notes: await store.listNotes(actor, project.id),
      people: await store.listParticipants(actor, project.id),
    })),
  );
  const recent = summaries
    .flatMap(({ project, notes }) =>
      notes.notes.map((note) => ({ ...note, projectName: project.name })),
    )
    .sort((a, b) => (b.editedAt || b.createdAt) - (a.editedAt || a.createdAt))
    .slice(0, 4);
  return (
    <div className="project-page workspace-home">
      <header className="project-heading">
        <div>
          <h1>Your workspace.</h1>
          <p>
            A shared home for the projects you and your agents are building.
          </p>
        </div>
        {actor.kind === "owner" && (
          <Link className="button" href="/workspace/new">
            <Icon name="Plus" />
            New project
          </Link>
        )}
      </header>
      <section className="project-section">
        <div className="section-title">
          <h2>Projects</h2>
          <span className="meta">{projects.length} projects</span>
        </div>
        <div className="project-index">
          {summaries.map(({ project, notes, people }) => (
            <Link
              className="project-index-row"
              key={project.id}
              href={`/workspace/projects/${project.id}`}
            >
              <span className="project-icon">
                <Icon name="Folder" />
              </span>
              <div className="row-copy">
                <h2>{project.name}</h2>
                <p>
                  {project.brief ||
                    "Add a brief to give your agents a starting point."}
                </p>
              </div>
              <span className="meta project-count">
                {people.filter((p) => p.kind === "agent").length} agents ·{" "}
                {notes.notes.length}
                {notes.nextOffset ? "+" : ""} notes
              </span>
              {notes.notes.some((n) => !n.read) && (
                <span className="context-chip">Unread context</span>
              )}
              <Icon name="CaretRight" />
            </Link>
          ))}
          {!projects.length && (
            <div className="empty-state">
              <Icon name="Folder" />
              <h2>Make room for the project.</h2>
              <p>
                {actor.kind === "owner"
                  ? "Create a project, add a brief and bring your first agent."
                  : "Your workspace owner can create the first project."}
              </p>
              {actor.kind === "owner" && (
                <Link className="button" href="/workspace/new">
                  Create a project
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
      <section className="project-section">
        <div className="section-title">
          <h2>Recently shared</h2>
          <Link className="text-link" href="/workspace/unread">
            View unread notes
          </Link>
        </div>
        <div className="context-list">
          {recent.map((note) => (
            <Link
              className="context-row"
              key={note.id}
              href={`/workspace/projects/${note.projectId}?note=${note.id}`}
            >
              <AgentMark name={note.authorName} small />
              <div className="row-copy">
                <h3>{note.title}</h3>
                <p>{note.body.slice(0, 180)}</p>
                <small>
                  {note.authorName} · {note.projectName}
                </small>
              </div>
              {!note.read ? (
                <span className="context-chip">Unread</span>
              ) : (
                <Icon name="CaretRight" />
              )}
            </Link>
          ))}
          {!recent.length && (
            <p className="empty-list">
              Shared notes will appear here when you or an agent contributes.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
