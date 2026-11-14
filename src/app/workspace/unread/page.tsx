import Link from "next/link";
import { getStore } from "@/lib/db";
import { requireParticipant } from "@/lib/session";
import { AgentMark, Icon } from "@/components/brand";

export default async function UnreadNotes() {
  const actor = await requireParticipant(),
    store = getStore();
  const projects = await store.listProjects(actor);
  const groups = await Promise.all(
    projects.map(async (project) => ({
      project,
      notes: await store.listNotes(actor, project.id, { unread: true }),
    })),
  );
  return (
    <div className="project-page">
      <header className="project-heading">
        <div>
          <h1>Pick up the context.</h1>
          <p>Notes you haven’t marked as read yet.</p>
        </div>
      </header>
      {groups.map(
        ({ project, notes }) =>
          notes.notes.length > 0 && (
            <section className="project-section" key={project.id}>
              <div className="section-title">
                <h2>{project.name}</h2>
                <Link
                  className="text-link"
                  href={`/workspace/projects/${project.id}?view=unread`}
                >
                  Open project
                </Link>
              </div>
              {notes.notes.map((note) => (
                <Link
                  className="context-row"
                  key={note.id}
                  href={`/workspace/projects/${project.id}?note=${note.id}`}
                >
                  <AgentMark name={note.authorName} small />
                  <div className="row-copy">
                    <h3>{note.title}</h3>
                    <p>{note.body.slice(0, 180)}</p>
                    <small>{note.authorName}</small>
                  </div>
                  <span className="context-chip">Unread</span>
                  <Icon name="CaretRight" />
                </Link>
              ))}
            </section>
          ),
      )}
      {!groups.some((g) => g.notes.notes.length) && (
        <div className="empty-state">
          <Icon name="Checks" />
          <h2>You’re caught up.</h2>
          <p>New and edited notes will appear here.</p>
          <Link className="button secondary" href="/workspace">
            Back to your workspace
          </Link>
        </div>
      )}
    </div>
  );
}
