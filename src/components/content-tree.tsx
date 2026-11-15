"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ContextMenu } from "@base-ui/react/context-menu";
import type { PageTreeItem, Project } from "@/lib/store";
import { Icon } from "./brand";
import { ActionMenu } from "./ui/action-menu";

export function contentActions(projectId: string, parentId?: string) {
  const base = `/workspace/projects/${projectId}`;
  const inside = parentId ? `&parent=${parentId}` : "";
  return [
    { label: "New page", href: `${base}/pages/new?kind=page${inside}` },
    { label: "New folder", href: `${base}/pages/new?kind=folder${inside}` },
    {
      label: "New collection",
      href: `${base}/pages/new?kind=collection${inside}`,
    },
    { label: "New note", href: `${base}?create=note` },
    { label: "Upload or import", href: `${base}/files#upload-files` },
  ];
}
export function ContentPlus({
  projectId,
  parentId,
  name,
}: {
  projectId: string;
  parentId?: string;
  name: string;
}) {
  return (
    <ActionMenu
      label={`Add inside ${name}`}
      trigger={<Icon name="Plus" />}
      items={contentActions(projectId, parentId)}
    />
  );
}
function TreeRow({
  project,
  item,
  items,
  owner,
  actorId,
  depth = 0,
  ancestors = [],
}: {
  project: Project;
  item?: PageTreeItem;
  items: PageTreeItem[];
  owner: boolean;
  actorId: string;
  depth?: number;
  ancestors?: string[];
}) {
  const pathname = usePathname();
  const id = item?.id || project.id,
    title = item?.title || project.name;
  const children = items.filter((p) => p.parentId === (item?.id || null));
  const [expanded, setExpanded] = useState(
    !item ||
      pathname.includes(id) ||
      children.some((p) => pathname.includes(p.id)),
  );
  const href = `/workspace/projects/${project.id}${item ? `/pages/${id}` : ""}`;
  const selected = pathname === href;
  const editable = owner || item?.authorId === actorId;
  const actions = [
    ...contentActions(project.id, item?.id),
    ...(editable
      ? [
          {
            label: "Rename or move",
            href: `${href}?edit=${item ? "1" : "project"}`,
          },
          {
            label: "Delete…",
            href: `${href}?delete=${item ? "1" : "project"}`,
            danger: true,
          },
        ]
      : []),
  ];
  return (
    <li>
      <ContextMenu.Root>
        <ContextMenu.Trigger
          render={<div />}
          className="tree-row"
          data-selected={selected || undefined}
          style={{ paddingLeft: Math.min(depth, 5) * 14 }}
        >
          <button
            className="tree-disclosure"
            aria-label={`${expanded ? "Collapse" : "Expand"} ${title}`}
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
            disabled={!children.length}
          >
            <Icon name={item?.kind === "page" ? "FileText" : "Folder"} />
            {!!children.length && (
              <span className="tree-chevron" data-expanded={expanded}>
                ›
              </span>
            )}
          </button>
          <Link
            className="tree-label"
            href={href}
            aria-current={selected ? "page" : undefined}
            title={title}
          >
            {title}
          </Link>
          <div className="tree-actions">
            <ContentPlus
              projectId={project.id}
              parentId={item?.id}
              name={title}
            />
            <ActionMenu label={`Actions for ${title}`} items={actions} />
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner className="entity-menu-positioner">
            <ContextMenu.Popup className="entity-menu-items">
              {actions.map((action) => (
                <ContextMenu.Item
                  key={action.href}
                  render={<Link href={action.href} />}
                  className={"danger" in action ? "danger-text" : undefined}
                >
                  {action.label}
                </ContextMenu.Item>
              ))}
            </ContextMenu.Popup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>
      {expanded && !!children.length && !ancestors.includes(id) && (
        <ul className="content-tree">
          {children.map((child) => (
            <TreeRow
              key={child.id}
              project={project}
              item={child}
              items={items}
              owner={owner}
              actorId={actorId}
              depth={depth + 1}
              ancestors={[...ancestors, id]}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
export function ContentTree({
  projects,
  items,
  owner,
  actorId,
}: {
  projects: Project[];
  items: PageTreeItem[];
  owner: boolean;
  actorId: string;
}) {
  return (
    <ul className="content-tree">
      {projects.map((project) => (
        <TreeRow
          key={project.id}
          project={project}
          items={items.filter((p) => p.projectId === project.id)}
          owner={owner}
          actorId={actorId}
        />
      ))}
    </ul>
  );
}
