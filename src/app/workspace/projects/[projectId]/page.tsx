import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { ContentPlus } from "@/components/content-tree";
import { Icon, AgentMark } from "@/components/brand";
import { ActionForm, CopyButton } from "@/components/forms";
import { ActionMenu } from "@/components/ui/action-menu";
import { NoteFields } from "@/components/note-fields";
import { ConnectAgentButton } from "@/components/app-interactions";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
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
  const base = `/workspace/projects/${projectId}`;
  if (query.view === "unread") redirect(base);
  const offset = Math.max(0, Math.min(1000000, Number(query.offset) || 0)),
    search = (query.q || "").slice(0, 200);
  const [notePage, pageList, activity] = await Promise.all([
    query.view === "notes"
      ? store.listNotes(actor, projectId, { query: search, offset })
      : { notes: [], nextOffset: null },
    store.listPages(actor, projectId, {
      parentId: null,
      query: search,
      offset,
    }),
    query.activity === "1" ? store.recentActivity(actor, projectId) : [],
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
  const closeHref = base;
  const canEditNote =
    note && (actor.kind === "owner" || note.authorId === actor.id);
  return (
    <>
      <div className="project-page" data-workspace-background>
        <header className="project-heading">
          <div>
            <h1 tabIndex={-1}>{project.name}</h1>
          </div>
          <div className="project-heading-actions">
            <ContentPlus projectId={projectId} name={project.name} />
            {actor.kind === "owner" && (
              <ConnectAgentButton
                className="button secondary"
                projectId={projectId}
                label="Connect an agent to this project"
              >
                <Icon name="UsersThree" /> Invite agent
              </ConnectAgentButton>
            )}
            <ActionMenu
              label="Project actions"
              items={[
                { label: "Files", href: `${base}/files` },
                { label: "Activity", href: `${base}?activity=1` },
                ...(actor.kind === "owner"
                  ? [
                      { label: "Edit project", href: `${base}?edit=project` },
                      {
                        label: "Delete project",
                        href: `${base}?delete=project`,
                        danger: true,
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        </header>
        {project.brief ? (
          <div className="project-purpose">
            <p>{project.brief}</p>
          </div>
        ) : actor.kind === "owner" ? (
          <Link
            className="text-link project-add-brief"
            href={`${base}?edit=project`}
          >
            Add brief
          </Link>
        ) : null}
        {!query.view && (
          <div className="project-overview-grid">
            <section className="project-section unified-content">
              <div className="section-title">
                <h2>Contents</h2>
              </div>
              {pageList.pages.map((page) => (
                <Link
                  className="context-row"
                  key={page.id}
                  href={`${base}/pages/${page.id}`}
                >
                  <Icon name={page.kind === "page" ? "FileText" : "Folder"} />
                  <div className="row-copy">
                    <h3>{page.title}</h3>
                    <p>{page.authorName}</p>
                  </div>
                  <span className="meta">
                    {page.kind === "collection" ? "folder" : page.kind}
                  </span>
                  <Icon name="CaretRight" />
                </Link>
              ))}
              {!pageList.pages.length && (
                <p className="empty-list">No pages yet.</p>
              )}
              {pageList.nextOffset !== null && (
                <Link
                  className="text-link"
                  href={`${base}?offset=${offset + 50}`}
                >
                  More pages
                </Link>
              )}
            </section>
          </div>
        )}
        {query.view === "notes" && (
          <>
            <form className="project-search" action={base}>
              <Icon name="MagnifyingGlass" />
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
            <section
              className="project-section"
              aria-labelledby="notes-heading"
            >
              <div className="section-title">
                <h2 id="notes-heading">Notes</h2>
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
                        <AgentMark identity={n.authorAgentIdentity} small />
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
                          {new Date(
                            n.editedAt || n.createdAt,
                          ).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                        </time>
                        <Icon name="CaretRight" />
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="empty-list">
                    {search ? "No notes match your search." : "No notes yet."}
                  </li>
                )}
              </ul>
            </section>
            {notePage.nextOffset !== null && (
              <Link
                className="show-more"
                href={`${base}?offset=${offset + 50}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
              >
                Earlier notes <Icon name="ArrowRight" />
              </Link>
            )}
            {offset > 0 && (
              <Link className="text-link" href={closeHref}>
                Back to latest
              </Link>
            )}
          </>
        )}
      </div>
      {query.activity === "1" && (
        <DetailSheet title="Activity" closeHref={base}>
          <ul className="project-activity">
            {activity.map((entry) => (
              <li key={entry.id}>
                <p>
                  <strong>{entry.authorName}</strong>{" "}
                  {entry.description.charAt(0).toLowerCase() +
                    entry.description.slice(1)}
                </p>
                <time dateTime={new Date(entry.createdAt).toISOString()}>
                  {new Date(entry.createdAt).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </li>
            ))}
          </ul>
          {!activity.length && <p className="meta">No activity yet.</p>}
        </DetailSheet>
      )}
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
        <ConfirmationDialog
          title="Delete project?"
          description={`This permanently deletes “${project.name}”, its pages, files, notes and activity. Project-only agents lose access and unused project invitations stop working. Other projects are unaffected.`}
          operation="delete-project"
          projectId={projectId}
          label="Delete project"
          closeHref={closeHref}
        >
          <label className="field">
            <span>Type {project.name} to confirm</span>
            <input name="confirmation" autoComplete="off" required />
          </label>
        </ConfirmationDialog>
      )}
      {note && query.delete === "note" && canEditNote && (
        <ConfirmationDialog
          title="Delete note?"
          description={`Permanently delete “${note.title}” and its references? This cannot be undone.`}
          operation="delete-note"
          label="Delete note"
          closeHref={`${base}?note=${note.id}`}
        >
          <input type="hidden" name="noteId" value={note.id} />
          <input type="hidden" name="version" value={note.version} />
        </ConfirmationDialog>
      )}
      {note && !(query.delete === "note" && canEditNote) && (
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
