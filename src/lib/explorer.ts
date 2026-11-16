export type ExplorerNode = {
  id: number;
  resourceId: string;
  kind: string;
  title: string;
  revoked: boolean;
  contentKind?: string | null;
};
export type ExplorerEdge = { source: number; target: number; kind: string };

export function referencePaths(
  nodes: ExplorerNode[],
  edges: ExplorerEdge[],
  start: number,
) {
  const allowed = new Set(nodes.map((node) => node.id));
  const paths = new Map<number, number[]>();
  const queue = [[start]];
  for (let i = 0; i < queue.length; i++) {
    const path = queue[i];
    if (path.length > 2) continue;
    for (const edge of edges) {
      if (
        edge.kind !== "REFERENCES" ||
        edge.source !== path.at(-1) ||
        !allowed.has(edge.target)
      )
        continue;
      if (edge.target === start || paths.has(edge.target)) continue;
      const next = [...path, edge.target];
      paths.set(edge.target, next);
      queue.push(next);
    }
  }
  return paths;
}

export function resourceHref(projectId: string, node: ExplorerNode) {
  const base = `/workspace/projects/${projectId}`;
  if (node.kind === "page") return `${base}/pages/${node.resourceId}`;
  if (node.kind === "file") return `${base}/files?file=${node.resourceId}`;
  if (node.kind === "note") return `${base}?note=${node.resourceId}`;
  if (node.kind === "project") return base;
  return null;
}

export function nodeKind(node: ExplorerNode) {
  if (node.contentKind === "folder" || node.contentKind === "collection")
    return "Folder";
  return (
    {
      page: "Page",
      file: "File",
      participant: "Contributor",
      project: "Project",
      note: "Note",
    }[node.kind] || node.kind
  );
}
