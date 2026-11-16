import { NewProjectButton } from "@/components/workspace-nav";
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
      pages: await store.listPages(actor, project.id),
      files: await store.listFiles(actor, project.id),
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
          <h1>Projects</h1>
        </div>
        {actor.kind === "owner" && (
          <NewProjectButton>
            <Icon name="Plus" />
            New project
          </NewProjectButton>
        )}
      </header>
      <section className="project-section">
        <div className="section-title">
          <span className="meta">
            {projects.length
              ? `${projects.length} project${projects.length === 1 ? "" : "s"}`
              : ""}
          </span>
        </div>
        <div className="project-index">
          {summaries.map(({ project, notes, people, pages, files }) => (
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
                {project.brief && <p>{project.brief}</p>}
              </div>
              <span className="meta project-count">
                {[
                  [
                    people.filter((p) => p.kind === "agent").length,
                    "agent",
                    false,
                  ],
                  [pages.pages.length, "page", pages.nextOffset !== null],
                  [files.files.length, "file", files.nextOffset !== null],
                  [notes.notes.length, "note", notes.nextOffset !== null],
                ]
                  .filter(([count]) => Number(count) > 0)
                  .map(
                    ([count, label, more]) =>
                      `${count}${more ? "+" : ""} ${label}${count === 1 ? "" : "s"}`,
                  )
                  .join(" · ")}
              </span>
              <Icon name="CaretRight" />
            </Link>
          ))}
          {!projects.length && (
            <div className="empty-state">
              <Icon name="Folder" />
              <h2>No projects yet</h2>
            </div>
          )}
        </div>
      </section>
      {!!recent.length && (
        <section className="project-section">
          <div className="section-title">
            <h2>Recently shared</h2>
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
          </div>
        </section>
      )}
    </div>
  );
}
