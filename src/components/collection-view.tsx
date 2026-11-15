import Link from "next/link";
import type { Principal, WorkspacePage } from "@/lib/store";
import { AgentMark } from "./brand";
import { ActionForm } from "./forms";
import { SelectField } from "./ui/select-field";

export function CollectionView({
  collection,
  items,
  actor,
  view,
}: {
  collection: WorkspacePage;
  items: WorkspacePage[];
  actor: Principal;
  view?: string;
}) {
  const base = `/workspace/projects/${collection.projectId}/pages/${collection.id}`;
  const selectedView =
    view || (collection.kind === "collection" ? "board" : "list");
  const statuses = ["Idea", "Drafting", "Ready"] as const;
  const statusControl = (item: WorkspacePage) =>
    actor.kind === "owner" || item.authorId === actor.id ? (
      <ActionForm
        operation="page-status"
        label="Save status"
        className="inline-status"
      >
        <input type="hidden" name="pageId" value={item.id} />
        <input type="hidden" name="version" value={item.version} />
        <SelectField
          label={`Status for ${item.title}`}
          hiddenLabel
          name="status"
          defaultValue={item.status}
          options={statuses.map((value) => ({ value, label: value }))}
        />
      </ActionForm>
    ) : (
      <span className="status-pill" data-status={item.status}>
        {item.status}
      </span>
    );
  return (
    <section className="collection-section">
      <div className="collection-toolbar">
        <h2>Contents</h2>
        <Link
          className="text-link"
          href={`/workspace/projects/${collection.projectId}/pages/new?parent=${collection.id}`}
        >
          + New page
        </Link>
      </div>
      <nav className="content-tabs" aria-label="Folder view">
        <Link
          href={`${base}?view=list`}
          aria-current={selectedView === "list" ? "page" : undefined}
        >
          List
        </Link>
        <Link
          href={`${base}?view=board`}
          aria-current={selectedView === "board" ? "page" : undefined}
        >
          Board
        </Link>
        <Link
          href={`${base}?view=table`}
          aria-current={selectedView === "table" ? "page" : undefined}
        >
          Table
        </Link>
      </nav>
      {selectedView === "list" ? (
        <div className="context-list">
          {items.map((item) => (
            <Link
              className="context-row"
              key={item.id}
              href={`/workspace/projects/${collection.projectId}/pages/${item.id}`}
            >
              <span className="row-copy">
                <h3>{item.title}</h3>
              </span>
              <span className="meta">
                {item.kind === "page" ? "Page" : "Folder"}
              </span>
            </Link>
          ))}
          {!items.length && <p className="empty-list">No content yet.</p>}
        </div>
      ) : selectedView === "table" ? (
        <div
          className="collection-table-wrap"
          role="region"
          aria-label="Folder table"
          tabIndex={0}
        >
          <table className="collection-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Contributor</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link
                      href={`/workspace/projects/${collection.projectId}/pages/${item.id}`}
                    >
                      {item.title}
                    </Link>
                  </td>
                  <td>{statusControl(item)}</td>
                  <td>
                    <span className="contributor">
                      <AgentMark name={item.authorName} small />
                      {item.authorName}
                    </span>
                  </td>
                  <td>
                    {new Date(
                      item.editedAt || item.createdAt,
                    ).toLocaleDateString("en-GB", {
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!items.length && <p className="empty-list">No content yet.</p>}
        </div>
      ) : (
        <div className="collection-board">
          {statuses.map((status) => (
            <section className="board-column" key={status} aria-label={status}>
              <header>
                <span className="status-pill" data-status={status}>
                  {status === "Idea" ? "Ideas" : status}
                </span>
                <small>
                  {items.filter((item) => item.status === status).length}
                </small>
                <Link
                  className="icon-button"
                  aria-label={`Add item to ${status}`}
                  href={`/workspace/projects/${collection.projectId}/pages/new?parent=${collection.id}&status=${status}`}
                >
                  +
                </Link>
              </header>
              {items
                .filter((item) => item.status === status)
                .map((item) => (
                  <article key={item.id} className="collection-card">
                    <Link
                      href={`/workspace/projects/${collection.projectId}/pages/${item.id}`}
                    >
                      <h3>{item.title}</h3>
                      <p>
                        {item.body.replace(/[#*`>]/g, "").slice(0, 120) || ""}
                      </p>
                      <span className="contributor">
                        <AgentMark name={item.authorName} small />
                        {item.authorName}
                      </span>
                    </Link>
                    {statusControl(item)}
                  </article>
                ))}
              {!items.some((item) => item.status === status) && (
                <p className="board-empty">—</p>
              )}
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
