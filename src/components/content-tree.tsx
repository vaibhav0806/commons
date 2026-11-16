"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
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
      label: "Upload or import",
      href: "#upload-files",
      onClick: () =>
        window.dispatchEvent(
          new CustomEvent("commons:upload", { detail: projectId }),
        ),
    },
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
            label: item ? "Rename or move" : "Rename",
            separator: true,
            href: `${href}?edit=${item ? "1" : "project"}`,
          },
          {
            label: "Delete",
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
          style={{ paddingLeft: 8 + Math.min(depth, 5) * 14 }}
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
              <svg
                className="tree-chevron"
                data-expanded={expanded}
                viewBox="0 0 16 16"
                aria-hidden="true"
              >
                <path
                  d="m6 3 5 5-5 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
          <Link
            className="tree-label"
            href={href}
            aria-current={selected ? "page" : undefined}
          >
            {title}
          </Link>
          <div className="tree-actions">
            <ActionMenu label={`Actions for ${title}`} items={actions} />
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner className="entity-menu-positioner">
            <ContextMenu.Popup className="entity-menu-items">
              {actions.map((action) => (
                <Fragment key={action.href}>
                  {"separator" in action && action.separator && (
                    <ContextMenu.Separator className="entity-menu-separator" />
                  )}
                  <ContextMenu.Item
                    render={<Link href={action.href} />}
                    onClick={
                      "onClick" in action && action.onClick
                        ? (event) => {
                            event.preventDefault();
                            action.onClick?.();
                          }
                        : undefined
                    }
                    className={"danger" in action ? "danger-text" : undefined}
                  >
                    {action.label}
                  </ContextMenu.Item>
                </Fragment>
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
  const [saved, setSaved] = useState<PageTreeItem[]>([]);
  useEffect(() => {
    const update = (event: Event) => {
      const item = (event as CustomEvent<PageTreeItem>).detail;
      setSaved((current) => [
        ...current.filter((page) => page.id !== item.id),
        item,
      ]);
    };
    window.addEventListener("commons:page-saved", update);
    return () => window.removeEventListener("commons:page-saved", update);
  }, []);
  const visibleItems = [
    ...items.filter((item) => !saved.some((page) => page.id === item.id)),
    ...saved,
  ];
  return (
    <ul className="content-tree">
      {projects.map((project) => (
        <TreeRow
          key={project.id}
          project={project}
          items={visibleItems.filter((p) => p.projectId === project.id)}
          owner={owner}
          actorId={actorId}
        />
      ))}
    </ul>
  );
}
