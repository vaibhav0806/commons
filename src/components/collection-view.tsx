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
        <h2>Collection</h2>
        <Link
          className="text-link"
          href={`/workspace/projects/${collection.projectId}/pages/new?parent=${collection.id}`}
        >
          + New item
        </Link>
      </div>
      <nav className="content-tabs" aria-label="Collection view">
        <Link href={base} aria-current={view !== "table" ? "page" : undefined}>
          Board
        </Link>
        <Link
          href={`${base}?view=table`}
          aria-current={view === "table" ? "page" : undefined}
        >
          Table
        </Link>
      </nav>
      {view === "table" ? (
        <div
          className="collection-table-wrap"
          role="region"
          aria-label="Collection table"
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
                    <Link href={`${base}?view=table&item=${item.id}`}>
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
          {!items.length && (
            <p className="empty-list">Add the first item to this collection.</p>
          )}
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
                    <Link href={`${base}?item=${item.id}`}>
                      <h3>{item.title}</h3>
                      <p>
                        {item.body.replace(/[#*`>]/g, "").slice(0, 120) ||
                          "Open to add context."}
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
                <p className="board-empty">Room for the next idea.</p>
              )}
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
