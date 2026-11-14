import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { ProjectTabs } from "@/components/project-tabs";
import { Icon, AgentMark } from "@/components/brand";
import { ActionForm, CopyButton } from "@/components/forms";
import { ActionMenu } from "@/components/ui/action-menu";
import { NoteFields } from "@/components/note-fields";
import {
  ConnectAgentButton,
  CommandSearchButton,
} from "@/components/app-interactions";
import { DetailSheet } from "@/components/detail-sheet";
import { getStore } from "@/lib/db";
import { appUrl, requireParticipant } from "@/lib/session";
import { CommonsError, type Note } from "@/lib/store";

const date = (time: number) =>
  new Date(time).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireParticipant(),
    { projectId } = await params,
    query = await searchParams,
    store = getStore();
  if (!z.uuid().safeParse(projectId).success) notFound();
  let project;
  try {
    project = await store.getProject(actor, projectId);
  } catch (error) {
    if (error instanceof CommonsError) {
      if (error.status === 401) redirect("/sign-in?session=ended");
      notFound();
    }
    throw error;
  }
  const base = `/workspace/projects/${projectId}`,
    unread = query.view === "unread";
  const offset = Math.max(0, Math.min(1000000, Number(query.offset) || 0)),
    search = (query.q || "").slice(0, 200);
  const [notePage, people, pageList] = await Promise.all([
    store.listNotes(actor, projectId, { query: search, unread, offset }),
    store.listParticipants(actor, projectId),
    store.listPages(actor, projectId),
  ]);
  let note: Note | undefined,
    detailError = false;
  if (query.note) {
    try {
      note = await store.getNote(actor, query.note);
      if (note.projectId !== projectId) {
        note = undefined;
        detailError = true;
      }
    } catch (error) {
      if (error instanceof CommonsError || error instanceof z.ZodError)
        detailError = true;
      else throw error;
    }
  }
  const closeHref = unread ? `${base}?view=unread` : base;
  const canEditNote =
    note && (actor.kind === "owner" || note.authorId === actor.id);
  return (
    <>
      <div className="project-page" data-workspace-background>
        <header className="project-heading">
          <div>
            <h1 tabIndex={-1}>{unread ? "Unread notes" : project.name}</h1>
            {unread && <p>Context you haven’t marked as read yet.</p>}
          </div>
          <div className="project-heading-actions">
            <CommandSearchButton />
            {actor.kind === "owner" && (
              <>
                <ConnectAgentButton
                  className="icon-button"
                  projectId={projectId}
                  label="Connect an agent to this project"
                >
                  <Icon name="Plus" />
                </ConnectAgentButton>
                <ActionMenu
                  label="Project actions"
                  items={[
                    { label: "Edit project", href: `${base}?edit=project` },
                    {
                      label: "Delete project",
                      href: `${base}?delete=project`,
                      danger: true,
                    },
                  ]}
                />
              </>
            )}
          </div>
        </header>
        <ProjectTabs
          projectId={projectId}
          active={unread || query.view === "notes" ? "Notes" : "Overview"}
        />
        <nav className="project-mobile-tabs" aria-label="Project views">
          <Link href={base} aria-current={!unread ? "page" : undefined}>
            Overview
          </Link>
          <Link
            href={`${base}?view=unread`}
            aria-current={unread ? "page" : undefined}
          >
            Unread notes
          </Link>
        </nav>
        {!unread && (
          <div className="project-purpose">
            <div className="brief-label">
              <span>Project brief</span>
            </div>
            <p>
              {project.brief ||
                "Leave a brief so your assistants know the goal and where to start."}
            </p>
          </div>
        )}
        {!unread && !query.view && (
          <section className="project-section">
            <div className="section-title">
              <h2>Pages</h2>
              <Link className="text-link" href={`${base}/pages/new`}>
                New page
              </Link>
            </div>
            {pageList.pages.slice(0, 3).map((page) => (
              <Link
                className="context-row compact-row"
                key={page.id}
                href={`${base}/pages/${page.id}`}
              >
                <Icon name="FileText" />
                <div className="row-copy">
                  <h3>{page.title}</h3>
                </div>
                <span className="meta">{page.authorName}</span>
                <Icon name="CaretRight" />
              </Link>
            ))}
            {!pageList.pages.length && (
              <Link className="context-row" href={`${base}/pages/new`}>
                <Icon name="Plus" />
                <span>Create a page or import your Markdown.</span>
              </Link>
            )}
            <Link className="text-link" href={`${base}/pages`}>
              View project pages
            </Link>
          </section>
        )}
        <form className="project-search" action={base}>
          <Icon name="MagnifyingGlass" />
          {unread && <input type="hidden" name="view" value="unread" />}
          <label className="visually-hidden" htmlFor="search">
            Search project notes
          </label>
          <input
            id="search"
            type="search"
            name="q"
            placeholder="Find context in this project…"
            defaultValue={search}
            maxLength={200}
          />
          <button className="text-link" type="submit">
            Search
          </button>
          {search && (
            <Link href={closeHref} className="text-link">
              Clear
            </Link>
          )}
        </form>
        <section className="project-section" aria-labelledby="notes-heading">
          <div className="section-title">
            <h2 id="notes-heading">{unread ? "New context" : "Notes"}</h2>
            <Link
              href={`${base}?create=note`}
              className="section-add"
              scroll={false}
            >
              <Icon name="Plus" />
              New note
            </Link>
          </div>
          <ul className="work-list">
            {notePage.notes.length ? (
              notePage.notes.map((n) => (
                <li className="work-row" key={n.id}>
                  <Link
                    className="row-link"
                    href={`${base}?note=${n.id}`}
                    scroll={false}
                  >
                    <AgentMark name={n.authorName} small />
                    <div className="row-copy">
                      <strong>{n.title}</strong>
                      <p className="note-excerpt">{n.body.slice(0, 160)}</p>
                      <p>
                        Note by {n.authorName}
                        {!n.read && (
                          <span className="unread-label"> · Unread</span>
                        )}
                        {n.editedAt && " · Edited"}
                      </p>
                    </div>
                    <time
                      dateTime={new Date(
                        n.editedAt || n.createdAt,
                      ).toISOString()}
                    >
                      {new Date(n.editedAt || n.createdAt).toLocaleDateString(
                        "en-GB",
                        { day: "numeric", month: "short" },
                      )}
                    </time>
                    <Icon name="CaretRight" />
                  </Link>
                </li>
              ))
            ) : (
              <li className="empty-list">
                {search
                  ? "No notes match your search."
                  : unread
                    ? "You’re caught up. New notes will appear here."
                    : "Start with a useful note. Give the next assistant context to work from."}
              </li>
            )}
          </ul>
        </section>
        {notePage.nextOffset !== null && (
          <Link
            className="show-more"
            href={`${base}?offset=${offset + 50}${unread ? "&view=unread" : ""}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
          >
            Earlier notes <Icon name="ArrowRight" />
          </Link>
        )}
        {offset > 0 && (
          <Link className="text-link" href={closeHref}>
            Back to latest
          </Link>
        )}
        <footer className="project-footnote">
          <Icon name="LockSimple" />
          <span>
            {actor.projectId
              ? "Access to this project only"
              : "Workspace access"}
          </span>
          <Link href="/workspace/agents" className="text-link">
            {people.filter((p) => p.kind === "agent").length} agents
          </Link>
        </footer>
      </div>
      {query.create === "note" && (
        <DetailSheet title="New note" closeHref={closeHref}>
          <p className="detail-intro">
            Leave something the next assistant can use.
          </p>
          <ActionForm
            operation="note"
            projectId={projectId}
            label="Share note"
            pendingLabel="Sharing…"
          >
            <input type="hidden" name="clientKey" value={randomUUID()} />
            <NoteFields />
          </ActionForm>
        </DetailSheet>
      )}
      {query.edit === "project" && actor.kind === "owner" && (
        <DetailSheet title="Edit project" closeHref={closeHref}>
          <ActionForm
            operation="edit-project"
            projectId={projectId}
            label="Save project"
          >
            <input type="hidden" name="version" value={project.version} />
            <label className="field">
              <span>Project name</span>
              <input
                name="name"
                defaultValue={project.name}
                minLength={2}
                maxLength={60}
                required
              />
            </label>
            <label className="field">
              <span>Project brief</span>
              <textarea
                name="brief"
                defaultValue={project.brief}
                maxLength={12000}
                rows={8}
              />
            </label>
          </ActionForm>
        </DetailSheet>
      )}
      {query.delete === "project" && actor.kind === "owner" && (
        <DetailSheet title="Delete project?" closeHref={closeHref}>
          <p className="detail-intro">
            This permanently deletes {project.name}, its notes and activity.
            Project-only agents lose access and unused project invitations stop
            working. Other projects are unaffected.
          </p>
          <ActionForm
            operation="delete-project"
            projectId={projectId}
            label="Delete project"
            pendingLabel="Deleting…"
            danger
          >
            <label className="field">
              <span>Type {project.name} to confirm</span>
              <input name="confirmation" autoComplete="off" required />
            </label>
          </ActionForm>
        </DetailSheet>
      )}
      {note && (
        <DetailSheet
          title={
            query.edit === "note"
              ? "Edit note"
              : query.delete === "note"
                ? "Delete note?"
                : note.title
          }
          label="Note"
          closeHref={closeHref}
        >
          {query.edit === "note" && canEditNote ? (
            <ActionForm
              operation="edit-note"
              label="Save note"
              projectId={projectId}
              key={`${note.id}:${note.version}`}
            >
              <input type="hidden" name="noteId" value={note.id} />
              <input type="hidden" name="version" value={note.version} />
              <NoteFields note={note} />
            </ActionForm>
          ) : query.delete === "note" && canEditNote ? (
            <>
              <p className="detail-intro">
                Permanently delete “{note.title}” and its references? This
                cannot be undone.
              </p>
              <ActionForm
                operation="delete-note"
                label="Delete note"
                pendingLabel="Deleting…"
                danger
              >
                <input type="hidden" name="noteId" value={note.id} />
                <input type="hidden" name="version" value={note.version} />
              </ActionForm>
              <Link className="text-link" href={`${base}?note=${note.id}`}>
                Keep note
              </Link>
            </>
          ) : (
            <>
              <p className="detail-intro">
                By {note.authorName} · {date(note.createdAt)}
                {note.editedAt && <> · Edited {date(note.editedAt)}</>}
              </p>
              {canEditNote && (
                <div className="entity-actions">
                  <Link
                    className="text-link"
                    href={`${base}?note=${note.id}&edit=note`}
                    scroll={false}
                  >
                    Edit note
                  </Link>
                  <Link
                    className="text-link danger-text"
                    href={`${base}?note=${note.id}&delete=note`}
                    scroll={false}
                  >
                    Delete note
                  </Link>
                </div>
              )}
              <div className="note-document">
                <p className="document-body">{note.body}</p>
                {!!note.referenceLinks.length && (
                  <div className="references">
                    {note.referenceLinks.map((r, i) => (
                      <a
                        className="reference"
                        key={i}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Icon name="FileText" />
                        {r.label}
                        <Icon name="ArrowUpRight" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <footer className="sheet-footer">
                {note.read ? (
                  <span className="read-state">
                    <Icon name="Checks" />
                    Marked as read
                  </span>
                ) : (
                  <ActionForm
                    operation="read"
                    label="Mark as read"
                    className="inline-form"
                  >
                    <input type="hidden" name="noteId" value={note.id} />
                  </ActionForm>
                )}
              </footer>
              <div className="copy-reference">
                <CopyButton
                  text={`${appUrl().origin}${base}?note=${note.id}`}
                  label="Copy note link"
                />
              </div>
            </>
          )}
        </DetailSheet>
      )}
      {detailError && (
        <DetailSheet title="Note unavailable" closeHref={closeHref}>
          <p className="detail-intro">
            It may have been deleted, or you no longer have access.
          </p>
        </DetailSheet>
      )}
    </>
  );
}
