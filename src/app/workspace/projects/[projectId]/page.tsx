import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { AgentMark, Icon } from "@/components/brand";
import { ActionForm, RecipientPicker, CopyButton } from "@/components/forms";
import {
  ConnectAgentButton,
  CommandSearchButton,
} from "@/components/app-interactions";
import { SelectField } from "@/components/ui/select-field";
import { DetailSheet } from "@/components/detail-sheet";
import { getStore } from "@/lib/db";
import { appUrl, requireParticipant } from "@/lib/session";
import { CommonsError, type Note, type DirectedRequest } from "@/lib/store";

const date = (time: number) =>
  new Date(time).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
function RequestRow({
  request,
  base,
}: {
  request: DirectedRequest;
  base: string;
}) {
  return (
    <li className="work-row">
      <Link
        href={`${base}?request=${request.id}`}
        className="row-link"
        scroll={false}
      >
        <span className="row-symbol">
          <Icon
            name={request.status === "done" ? "CheckCircle" : "ArrowUpRight"}
          />
        </span>
        <div className="row-copy">
          <strong>{request.title}</strong>
          <p>
            {request.authorName} asked{" "}
            {request.recipients.map((r) => r.name).join(", ")}
            <span
              className={`compact-state ${request.status !== "open" ? "acknowledged" : ""}`}
            >
              {request.status === "done"
                ? "Completed"
                : request.status === "in_progress"
                  ? "Acknowledged"
                  : "Waiting"}
            </span>
          </p>
        </div>
        <span
          className={`row-state ${request.status !== "open" ? "acknowledged" : ""}`}
        >
          {request.status === "done"
            ? "Completed"
            : request.status === "in_progress"
              ? "Acknowledged"
              : "Waiting"}
        </span>
        <Icon name="CaretRight" />
      </Link>
      {request.resultNoteId && (
        <Link
          href={`${base}?note=${request.resultNoteId}`}
          className="result-link"
          scroll={false}
        >
          <Icon name="Note" />
          View the result note
        </Link>
      )}
    </li>
  );
}
function NoteRow({ note, base }: { note: Note; base: string }) {
  return (
    <li className="work-row">
      <Link
        href={`${base}?note=${note.id}`}
        className="row-link"
        scroll={false}
      >
        <span className={`row-symbol ${note.read ? "muted" : ""}`}>
          <Icon name="Note" />
        </span>
        <div className="row-copy">
          <strong>{note.title}</strong>
          <p>
            Note by {note.authorName}
            {!note.read && <span className="unread-label"> · Unread</span>}
          </p>
        </div>
        <time dateTime={new Date(note.createdAt).toISOString()}>
          {new Date(note.createdAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })}
        </time>
        <Icon name="CaretRight" />
      </Link>
    </li>
  );
}
export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireParticipant(),
    { projectId } = await params,
    raw = await searchParams,
    store = getStore();
  const query = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
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
    mine = query.view === "mine",
    unread = query.view === "unread";
  const offset = Math.max(0, Math.min(1000000, Number(query.offset) || 0)),
    search = (query.q || "").slice(0, 200);
  const [notePage, requestPage, people] = await Promise.all([
    store.listNotes(actor, projectId, { query: search, unread, offset }),
    store.listRequests(actor, projectId, { mine, query: search, offset }),
    store.listParticipants(actor, projectId),
  ]).catch((error) => {
    if (error instanceof CommonsError && error.status === 401)
      redirect("/sign-in?session=ended");
    throw error;
  });
  const active = requestPage.requests.filter((r) => r.status !== "done"),
    completed = requestPage.requests.filter((r) => r.status === "done");
  let note: Note | undefined,
    request: DirectedRequest | undefined,
    detailError = false;
  try {
    if (query.note) {
      note = await store.getNote(actor, query.note);
      if (note.projectId !== projectId) {
        note = undefined;
        detailError = true;
      }
    }
    if (query.request) {
      request = await store.getRequest(actor, query.request);
      if (request.projectId !== projectId) {
        request = undefined;
        detailError = true;
      }
    }
  } catch (error) {
    if (error instanceof CommonsError || error instanceof z.ZodError)
      detailError = true;
    else throw error;
  }
  const closeHref = mine || unread ? `${base}?view=${query.view}` : base;
  const requestsForMe = request?.recipients.find((r) => r.id === actor.id),
    canComplete = actor.kind === "owner" || !!requestsForMe?.acknowledgedAt;
  const sourceNote = request?.noteId
    ? await store.getNote(actor, request.noteId)
    : null;
  const resultNote = request?.resultNoteId
    ? await store.getNote(actor, request.resultNoteId)
    : null;
  const title = mine
    ? "Requests for me"
    : unread
      ? "Unread notes"
      : project.name;
  return (
    <>
      <div className="project-page" data-workspace-background>
        <header className="project-heading">
          <div>
            <h1 tabIndex={-1}>{title}</h1>
            {(mine || unread) && (
              <p>
                {mine
                  ? "Work other agents have asked you to pick up."
                  : "Context you haven’t marked as read yet."}
              </p>
            )}
          </div>
          <div className="project-heading-actions">
            <CommandSearchButton />
            {actor.kind === "owner" && (
              <ConnectAgentButton
                className="icon-button"
                projectId={projectId}
                label="Connect an agent to this project"
              >
                <Icon name="Plus" />
              </ConnectAgentButton>
            )}
          </div>
        </header>
        <nav className="project-mobile-tabs" aria-label="Project views">
          <Link
            href={base}
            aria-current={!mine && !unread ? "page" : undefined}
          >
            Overview
          </Link>
          {actor.kind === "agent" && (
            <Link
              href={`${base}?view=mine`}
              aria-current={mine ? "page" : undefined}
            >
              For me
            </Link>
          )}
          <Link
            href={`${base}?view=unread`}
            aria-current={unread ? "page" : undefined}
          >
            Unread notes
          </Link>
        </nav>
        {!mine && !unread && (
          <div className="project-purpose">
            <div className="brief-label">
              <span>Project brief</span>
              {actor.kind === "owner" && (
                <Link
                  href={`${base}?edit=brief`}
                  className="text-link"
                  scroll={false}
                >
                  Edit
                </Link>
              )}
            </div>
            <p>
              {project.brief ||
                "Leave a brief so your assistants know the goal and where to start."}
            </p>
          </div>
        )}
        <form className="project-search" action={base}>
          <Icon name="MagnifyingGlass" />
          {query.view && <input type="hidden" name="view" value={query.view} />}
          <label className="visually-hidden" htmlFor="search">
            Search project notes and requests
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
        {!unread && (
          <section
            className="project-section"
            aria-labelledby="requests-heading"
          >
            <div className="section-title">
              <div>
                <h2 id="requests-heading">
                  {mine ? "To pick up" : "Requests"}
                </h2>
              </div>
              <Link
                href={`${base}?create=request`}
                className="section-add"
                scroll={false}
              >
                <Icon name="Plus" />
                New request
              </Link>
            </div>
            <ul className="work-list">
              {active.length ? (
                active.map((r) => (
                  <RequestRow request={r} base={base} key={r.id} />
                ))
              ) : (
                <li className="empty-list">
                  {search
                    ? "No requests match your search."
                    : mine
                      ? "No requests waiting for you."
                      : "No open requests. Leave a note or ask an agent for a next step."}
                </li>
              )}
            </ul>
            {!!completed.length && (
              <details className="completed-work">
                <summary>
                  <Icon name="Check" />
                  Completed requests <span>{completed.length}</span>
                </summary>
                <ul className="work-list">
                  {completed.map((r) => (
                    <RequestRow request={r} base={base} key={r.id} />
                  ))}
                </ul>
              </details>
            )}
          </section>
        )}
        {!mine && (
          <section className="project-section" aria-labelledby="notes-heading">
            <div className="section-title">
              <div>
                <h2 id="notes-heading">{unread ? "New context" : "Notes"}</h2>
              </div>
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
                  <NoteRow note={n} base={base} key={n.id} />
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
        )}
        {(notePage.nextOffset !== null || requestPage.nextOffset !== null) && (
          <Link
            className="show-more"
            href={`${base}?offset=${offset + 50}${query.view ? `&view=${query.view}` : ""}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
          >
            Earlier contributions <Icon name="ArrowRight" />
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
            label="Publish note"
            pendingLabel="Publishing…"
          >
            <input type="hidden" name="clientKey" value={randomUUID()} />
            <label className="field">
              <span>Note title</span>
              <input
                name="title"
                placeholder="What should the next assistant know?"
                maxLength={160}
                required
              />
            </label>
            <label className="field">
              <span>Context</span>
              <textarea
                name="body"
                placeholder="A decision, a finding, or a useful next step…"
                maxLength={12000}
                rows={8}
                required
              />
            </label>
            <details className="optional-fields">
              <summary>Add a reference</summary>
              <label className="field">
                <span>Reference label</span>
                <input
                  name="referenceLabel"
                  maxLength={120}
                  placeholder="e.g. Product brief"
                />
              </label>
              <label className="field">
                <span>Reference URL</span>
                <input
                  name="referenceUrl"
                  type="url"
                  maxLength={2048}
                  placeholder="https://…"
                />
              </label>
            </details>
          </ActionForm>
        </DetailSheet>
      )}
      {query.create === "request" && (
        <DetailSheet title="New request" closeHref={closeHref}>
          <p className="detail-intro">
            Ask an agent to pick up a specific piece of work.
          </p>
          <p className="request-from">
            From <AgentMark name={actor.name} small />
            <strong>{actor.name}</strong>
          </p>
          <ActionForm
            operation="request"
            projectId={projectId}
            label="Create request"
            pendingLabel="Saving request…"
          >
            <input type="hidden" name="clientKey" value={randomUUID()} />
            <label className="field">
              <span>What should they do?</span>
              <input
                name="title"
                maxLength={160}
                required
                placeholder="e.g. Draft the launch post"
              />
            </label>
            <RecipientPicker
              people={people.filter((p) => p.kind === "agent")}
            />
            <label className="field">
              <span>What do they need to know?</span>
              <textarea
                name="body"
                required
                maxLength={12000}
                rows={5}
                placeholder="Add enough context to get started."
              />
            </label>
            <SelectField
              label="Attach a note (optional)"
              name="noteId"
              defaultValue={query.source || ""}
              options={[
                { value: "", label: "No note attached" },
                ...notePage.notes.map((note) => ({
                  value: note.id,
                  label: `${note.title} — ${note.authorName}`,
                })),
              ]}
            />
            <p className="meta">
              The agent will find this on its next visit. Creating a request
              does not start the agent.
            </p>
          </ActionForm>
        </DetailSheet>
      )}
      {query.edit === "brief" && actor.kind === "owner" && (
        <DetailSheet title="The project brief." closeHref={closeHref}>
          <ActionForm
            operation="brief"
            projectId={projectId}
            label="Save brief"
          >
            <label className="field">
              <span>What are we working toward?</span>
              <textarea
                name="brief"
                rows={10}
                maxLength={12000}
                defaultValue={project.brief}
              />
            </label>
          </ActionForm>
        </DetailSheet>
      )}
      {note && (
        <DetailSheet title={note.title} label="Note" closeHref={closeHref}>
          <div className="note-byline">
            <AgentMark name={note.authorName} />
            <div>
              <strong>{note.authorName} shared this note</strong>
              <small>{date(note.createdAt)}</small>
            </div>
          </div>
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
            <Link
              className="button secondary"
              href={`${base}?create=request&source=${note.id}`}
              scroll={false}
            >
              Ask an agent about this <Icon name="ArrowUpRight" />
            </Link>
          </footer>
          <div className="copy-reference">
            <CopyButton
              text={`${appUrl().origin}${base}?note=${note.id}`}
              label="Copy note link"
            />
          </div>
        </DetailSheet>
      )}
      {request && (
        <DetailSheet
          title={request.title}
          label="Request"
          closeHref={closeHref}
        >
          <div className="handoff-people">
            <div>
              <span>Requested by</span>
              <strong>
                <AgentMark name={request.authorName} small />
                {request.authorName}
              </strong>
            </div>
            <Icon name="ArrowRight" />
            <div>
              <span>Asked to respond</span>
              <strong>
                {request.recipients.map((r) => (
                  <span className="recipient-name" key={r.id}>
                    <AgentMark name={r.name} small />
                    {r.name}
                    {r.revokedAt ? " · access revoked" : ""}
                  </span>
                ))}
              </strong>
            </div>
          </div>
          <p
            className={`detail-state ${request.status !== "open" ? "accepted" : ""}`}
          >
            <Icon name={request.status === "open" ? "Clock" : "Checks"} />
            {request.status === "done"
              ? "Completed"
              : request.status === "in_progress"
                ? "Acknowledged · work can be picked up"
                : "Waiting for acknowledgement"}
          </p>
          <div className="sheet-body">{request.body}</div>
          {sourceNote && (
            <section className="request-context">
              <h3>Context to start from</h3>
              <Link
                className="context-note"
                href={`${base}?note=${sourceNote.id}`}
                scroll={false}
              >
                <Icon name="Note" />
                <div>
                  <strong>{sourceNote.title}</strong>
                  <small>{sourceNote.authorName}</small>
                </div>
                <Icon name="CaretRight" />
              </Link>
            </section>
          )}
          {resultNote && (
            <section className="request-context">
              <h3>What came back</h3>
              <Link
                className="context-note"
                href={`${base}?note=${resultNote.id}`}
                scroll={false}
              >
                <Icon name="Note" />
                <div>
                  <strong>{resultNote.title}</strong>
                  <small>{resultNote.authorName} shared the result</small>
                </div>
                <Icon name="CaretRight" />
              </Link>
            </section>
          )}
          <details className="request-history">
            <summary>Request history</summary>
            <p>Created {date(request.createdAt)}</p>
            {request.recipients.map((r) => (
              <p key={r.id}>
                {r.name}:{" "}
                {r.acknowledgedAt
                  ? `acknowledged ${date(r.acknowledgedAt)}`
                  : "not acknowledged"}
              </p>
            ))}
            {request.completedAt && (
              <p>Completed {date(request.completedAt)}</p>
            )}
          </details>
          {!request.completedAt && (
            <footer className="sheet-footer">
              {requestsForMe && !requestsForMe.acknowledgedAt ? (
                <ActionForm operation="acknowledge" label="Acknowledge request">
                  <input type="hidden" name="requestId" value={request.id} />
                  <p className="meta">
                    Acknowledgement confirms you’ve picked it up. Completion is
                    a separate step.
                  </p>
                </ActionForm>
              ) : canComplete ? (
                <ActionForm operation="complete" label="Mark complete">
                  <input type="hidden" name="requestId" value={request.id} />
                  <SelectField
                    label="Link a result note (optional)"
                    name="resultNoteId"
                    defaultValue=""
                    options={[
                      { value: "", label: "No result note" },
                      ...notePage.notes.map((note) => ({
                        value: note.id,
                        label: note.title,
                      })),
                    ]}
                  />
                </ActionForm>
              ) : (
                <p className="meta">
                  The named recipient can acknowledge this on their next visit.
                </p>
              )}
            </footer>
          )}
          <div className="copy-reference">
            <CopyButton
              text={`${appUrl().origin}${base}?request=${request.id}`}
              label="Copy request link"
            />
          </div>
        </DetailSheet>
      )}
      {detailError && (
        <DetailSheet
          title="This item isn’t available."
          label="Access"
          closeHref={closeHref}
        >
          <p className="body-copy">
            It may be outside this project or your access. Return to the project
            to find available context.
          </p>
        </DetailSheet>
      )}
    </>
  );
}
