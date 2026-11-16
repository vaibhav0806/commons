"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "./brand";
import { SelectField } from "./ui/select-field";
import {
  nodeKind,
  referencePaths,
  resourceHref,
  type ExplorerNode,
  type ExplorerEdge,
} from "@/lib/explorer";
import styles from "./graph-explorer.module.css";

export function GraphExplorer({
  nodes,
  edges,
  projectId,
  projects,
  ready,
  available,
  truncated,
  syncedAt,
}: {
  nodes: ExplorerNode[];
  edges: ExplorerEdge[];
  projectId: string;
  projects: { id: string; name: string }[];
  ready: boolean;
  available: boolean;
  truncated: boolean;
  syncedAt?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<number | null>(null);
  const [view, setView] = useState("references");
  const [history, setHistory] = useState<number[]>([]);
  const references = edges.filter((edge) => edge.kind === "REFERENCES");
  const pages = nodes.filter(
    (node) => node.kind === "page" && nodeKind(node) === "Page",
  );
  const files = nodes.filter((node) => node.kind === "file");
  const unlinked = (node: ExplorerNode) =>
    node.kind === "file"
      ? !references.some((edge) => edge.target === node.id)
      : node.kind === "page" &&
        nodeKind(node) === "Page" &&
        !references.some((edge) => edge.source === node.id);
  const gaps = nodes.filter(unlinked);
  const matches = nodes.filter(
    (node) =>
      node.title.toLowerCase().includes(query.toLowerCase()) &&
      (filter === "all" ||
        (filter === "unlinked" ? unlinked(node) : nodeKind(node) === filter)),
  );
  const defaultNode =
    nodes.find(
      (node) =>
        node.kind === "page" &&
        references.some((edge) => edge.source === node.id),
    ) ||
    pages[0] ||
    nodes[0];
  const active = nodes.find((node) => node.id === selected) || defaultNode;
  const relevant = edges.filter(
    (edge) =>
      (edge.source === active?.id || edge.target === active?.id) &&
      (view === "references"
        ? edge.kind === "REFERENCES"
        : view === "people"
          ? edge.kind === "AUTHORED_BY"
          : edge.kind === "IN_PAGE" || edge.kind === "IN_PROJECT"),
  );
  const incoming = relevant.filter((edge) => edge.target === active?.id);
  const outgoing = relevant.filter((edge) => edge.source === active?.id);
  const paths =
    active && ready
      ? referencePaths(nodes, edges, active.id)
      : new Map<number, number[]>();
  const indirect = [...paths].filter(([, path]) => path.length === 3);
  const href = active && resourceHref(projectId, active);
  function focus(id: number) {
    if (active && active.id !== id)
      setHistory((current) => [...current.slice(-19), active.id]);
    setSelected(id);
  }
  function nodeButton(node: ExplorerNode, relation?: string) {
    return (
      <button
        type="button"
        className={styles.node}
        onClick={() => focus(node.id)}
        aria-pressed={node.id === active?.id}
      >
        <span className={styles.kind}>{relation || nodeKind(node)}</span>
        <strong>{node.title}</strong>
        {node.revoked && <small>Former contributor</small>}
      </button>
    );
  }
  const labels =
    view === "references"
      ? ["Used by", "References"]
      : view === "people"
        ? ["Contributions", "Created by"]
        : ["Contains", "Inside"];
  return (
    <div className={styles.explorer}>
      <div className={styles.toolbar}>
        <SelectField
          label="Explorer project"
          hiddenLabel
          value={projectId}
          options={projects.map((project) => ({
            value: project.id,
            label: project.name,
          }))}
          onValueChange={(id) => router.push(`/workspace/graph?project=${id}`)}
        />
        <span
          className={styles.sync}
          role="status"
          title={
            syncedAt
              ? `Last synced ${new Date(syncedAt).toISOString()}`
              : undefined
          }
        >
          {pending
            ? "Refreshing…"
            : !available
              ? "Connections unavailable"
              : ready
                ? "Synced with HydraDB"
                : "Syncing changes…"}
        </span>
        <button
          type="button"
          className="text-button"
          disabled={pending}
          onClick={() => startTransition(() => router.refresh())}
        >
          Refresh
        </button>
      </div>
      <div className={styles.body}>
        <aside className={styles.index} aria-label="Explorer records">
          <label className={styles.search}>
            <Icon name="MagnifyingGlass" />
            <input
              aria-label="Find in explorer"
              placeholder="Find a page, file, person…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <SelectField
            label="Show records"
            hiddenLabel
            value={filter}
            onValueChange={setFilter}
            options={[
              { value: "all", label: "Everything" },
              { value: "Page", label: "Pages" },
              { value: "File", label: "Files" },
              { value: "Folder", label: "Folders" },
              { value: "Contributor", label: "Contributors" },
              { value: "unlinked", label: "Needs linking", disabled: !ready },
            ]}
          />
          <div className={styles.records}>
            {matches.map((node) => (
              <div key={node.id}>{nodeButton(node)}</div>
            ))}
            {!matches.length && (
              <p className={styles.empty}>
                {query || filter !== "all"
                  ? "No matching records."
                  : "Add a page or file to start exploring."}
              </p>
            )}
          </div>
        </aside>
        <section className={styles.focus} aria-label="Connections">
          <div className={styles.focusHeader}>
            <button
              type="button"
              className="text-button"
              disabled={!history.length}
              onClick={() => {
                setSelected(history.at(-1)!);
                setHistory(history.slice(0, -1));
              }}
            >
              ← Back
            </button>
            <div className={styles.views} aria-label="Connection type">
              {[
                ["references", "References"],
                ["people", "People"],
                ["structure", "Structure"],
              ].map(([id, label]) => (
                <button
                  type="button"
                  key={id}
                  aria-pressed={view === id}
                  onClick={() => setView(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            {href && (
              <Link className="text-link" href={href}>
                Open ↗
              </Link>
            )}
          </div>
          {active ? (
            <>
              <div className={styles.map}>
                <div className={styles.branch}>
                  <h3>{labels[0]}</h3>
                  {incoming.slice(0, 8).map((edge) => (
                    <div
                      className={styles.incoming}
                      key={`${edge.source}:${edge.kind}`}
                    >
                      {nodeButton(
                        nodes.find((node) => node.id === edge.source)!,
                      )}
                    </div>
                  ))}
                  {!incoming.length && (
                    <p className={styles.empty}>
                      {ready ? "No connections yet" : "Waiting for connections"}
                    </p>
                  )}
                </div>
                <div className={styles.center}>
                  <span className={styles.kind}>{nodeKind(active)}</span>
                  <h2>{active.title}</h2>
                  {active.revoked && (
                    <small>Former contributor · authorship retained</small>
                  )}
                </div>
                <div className={styles.branch}>
                  <h3>{labels[1]}</h3>
                  {outgoing.slice(0, 8).map((edge) => (
                    <div
                      className={styles.outgoing}
                      key={`${edge.target}:${edge.kind}`}
                    >
                      {nodeButton(
                        nodes.find((node) => node.id === edge.target)!,
                      )}
                    </div>
                  ))}
                  {!outgoing.length && (
                    <p className={styles.empty}>
                      {ready ? "No connections yet" : "Waiting for connections"}
                    </p>
                  )}
                </div>
              </div>
              {(incoming.length > 8 || outgoing.length > 8) && (
                <details className={styles.more}>
                  <summary>All {relevant.length} connections</summary>
                  {relevant.map((edge) => {
                    const node = nodes.find(
                      (node) =>
                        node.id ===
                        (edge.source === active.id ? edge.target : edge.source),
                    )!;
                    return (
                      <div key={`${edge.source}:${edge.target}:${edge.kind}`}>
                        {nodeButton(
                          node,
                          edge.source === active.id ? labels[1] : labels[0],
                        )}
                      </div>
                    );
                  })}
                </details>
              )}
              {view === "references" && (
                <div className={styles.paths}>
                  <h3>
                    One link further <span>{indirect.length}</span>
                  </h3>
                  {indirect.map(([id, path]) => (
                    <button type="button" key={id} onClick={() => focus(id)}>
                      <strong>
                        {nodes.find((node) => node.id === id)?.title}
                      </strong>
                      <span>
                        via {nodes.find((node) => node.id === path[1])?.title} →
                      </span>
                    </button>
                  ))}
                  {!indirect.length && (
                    <p className={styles.empty}>
                      {ready
                        ? "Deeper sources appear when linked pages reference other material."
                        : "Sources will appear after the graph syncs."}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className={styles.empty}>
              Your project’s connections will appear after its first sync.
            </p>
          )}
        </section>
      </div>
      <details className={styles.health}>
        <summary>
          Context health{" "}
          {ready && !truncated && (
            <span>
              {gaps.length} {gaps.length === 1 ? "item" : "items"} without
              references
            </span>
          )}
        </summary>
        {ready ? (
          <>
            <div className={styles.metrics}>
              <div>
                <strong>
                  {pages.filter((node) => !unlinked(node)).length} /{" "}
                  {pages.length}
                </strong>
                <span>Pages linking to source material</span>
              </div>
              <div>
                <strong>
                  {files.filter((node) => !unlinked(node)).length} /{" "}
                  {files.length}
                </strong>
                <span>Files referenced in pages</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFilter("unlinked");
                  setQuery("");
                }}
              >
                <strong>{gaps.length}</strong>
                <span>Review items without references →</span>
              </button>
            </div>
            <p>
              Explicit project links only. An unlinked item may be intentional.
              These counts describe connections, not quality or learning.
            </p>
          </>
        ) : (
          <p>
            Connection health is unavailable until the current project revision
            finishes syncing.
          </p>
        )}
        <p>
          {nodes.length} records loaded
          {truncated
            ? " · Partial graph: counts and paths cover the loaded subset only."
            : "."}{" "}
          Up to 200 records and 1,000 connections per type.
        </p>
      </details>
    </div>
  );
}
