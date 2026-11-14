"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./graph-explorer.module.css";
type Node = {
  id: number;
  resourceId: string;
  kind: string;
  title: string;
  revoked: boolean;
};
type Edge = { source: number; target: number; kind: string };
export function GraphExplorer({
  nodes,
  edges,
  projectId,
}: {
  nodes: Node[];
  edges: Edge[];
  projectId: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const active = nodes.find((n) => n.id === selected);
  const visible = nodes.slice(0, 60);
  const groups = ["project", "participant", "note"];
  const positions = new Map<number, { x: number; y: number }>();
  groups.forEach((kind, column) =>
    visible
      .filter((n) => n.kind === kind)
      .forEach((node, row) =>
        positions.set(node.id, { x: 25 + column * 250, y: 55 + row * 92 }),
      ),
  );
  const height = Math.max(300, ...[...positions.values()].map((p) => p.y + 90));
  const connections =
    selected === null
      ? edges
      : edges.filter((e) => e.source === selected || e.target === selected);
  const related = new Set(connections.flatMap((e) => [e.source, e.target]));
  return (
    <div className={styles.explorer}>
      <div className={styles.toolbar}>
        <button className="text-button" onClick={() => router.refresh()}>
          Refresh graph
        </button>
        <span>
          {nodes.length} records · {edges.length} relationships
        </span>
        <button className="text-button" onClick={() => setSelected(null)}>
          Show all
        </button>
      </div>
      <div className={styles.scroll}>
        <div className={styles.canvas} style={{ height }}>
          {groups.map((kind, i) => (
            <span
              className={styles.column}
              style={{ left: 25 + i * 250 }}
              key={kind}
            >
              {kind}s
            </span>
          ))}
          <svg
            width="1000"
            height={height}
            aria-hidden="true"
            className={styles.lines}
          >
            {connections.map((edge, i) => {
              const a = positions.get(edge.source),
                b = positions.get(edge.target);
              if (!a || !b) return null;
              return (
                <path
                  key={i}
                  d={`M ${a.x + 100} ${a.y + 27} C ${a.x + 100} ${a.y - 12}, ${b.x + 100} ${b.y - 12}, ${b.x + 100} ${b.y + 27}`}
                />
              );
            })}
          </svg>
          {visible.map((node) => (
            <button
              key={node.id}
              className={styles.node}
              style={{
                left: positions.get(node.id)!.x,
                top: positions.get(node.id)!.y,
                opacity:
                  selected !== null &&
                  !related.has(node.id) &&
                  selected !== node.id
                    ? 0.4
                    : 1,
              }}
              aria-pressed={selected === node.id}
              onClick={() => setSelected(node.id)}
              title={node.title}
            >
              <span>{node.title}</span>
              {node.revoked && <small>Revoked · history retained</small>}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.details}>
        <h3>{active?.title || "Select a record"}</h3>
        {active && (
          <>
            <p className="meta">
              {active.kind} · {active.resourceId}
            </p>
            {(active.kind === "note") && (
              <Link
                href={`/workspace/projects/${projectId}?${active.kind}=${active.resourceId}`}
              >
                Open in project →
              </Link>
            )}
            <ul>
              {connections.map((edge, i) => (
                <li key={i}>
                  {nodes.find((n) => n.id === edge.source)?.title}{" "}
                  <strong>
                    {edge.kind.toLowerCase().replaceAll("_", " ")}
                  </strong>{" "}
                  {nodes.find((n) => n.id === edge.target)?.title}
                </li>
              ))}
            </ul>
            {!connections.length && <p>No stored relationships yet.</p>}
          </>
        )}
        {visible.length < nodes.length && (
          <p className="meta">The visual view shows the first 60 records.</p>
        )}
      </div>
    </div>
  );
}
