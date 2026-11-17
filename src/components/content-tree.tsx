"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { ContextMenu } from "@base-ui/react/context-menu";
import type { PageTreeItem, Project } from "@/lib/store";
import { Icon, PageIcon } from "./brand";
import { ActionMenu } from "./ui/action-menu";
import { InlineName } from "./inline-name";
import { createSidebarFolder } from "@/app/actions";

export type FolderDraft = {
  projectId: string;
  parentId?: string;
  clientKey: string;
};

function folderPath(items: PageTreeItem[], draft: FolderDraft) {
  const path = [draft.projectId];
  let parentId = draft.parentId;
  while (parentId && !path.includes(parentId)) {
    path.push(parentId);
    parentId =
      items.find((item) => item.id === parentId)?.parentId || undefined;
  }
  return path;
}

export function contentActions(projectId: string, parentId?: string) {
  const base = `/workspace/projects/${projectId}`;
  const inside = parentId ? `&parent=${parentId}` : "";
  return [
    { label: "New page", href: `${base}/pages/new?kind=page${inside}` },
    {
      label: parentId ? "New subfolder" : "New folder",
      href: `${base}/pages/new?kind=folder${inside}`,
      onClick: () =>
        window.dispatchEvent(
          new CustomEvent("commons:create-folder", {
            detail: {
              projectId,
              parentId,
              clientKey: crypto.randomUUID(),
            } satisfies FolderDraft,
          }),
        ),
    },
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
  expandedRows,
  onToggle,
  folder,
  onCancel,
  onCreate,
}: {
  project: Project;
  item?: PageTreeItem;
  items: PageTreeItem[];
  owner: boolean;
  actorId: string;
  depth?: number;
  ancestors?: string[];
  expandedRows: Record<string, boolean>;
  onToggle: (id: string, expanded: boolean) => void;
  folder?: FolderDraft;
  onCancel: () => void;
  onCreate: (name: string) => Promise<string | undefined>;
}) {
  const pathname = usePathname();
  const row = useRef<HTMLDivElement>(null);
  const id = item?.id || project.id,
    title = item?.title || project.name;
  const children = items.filter((p) => p.parentId === (item?.id || null));
  const expanded =
    expandedRows[id] ??
    (!item ||
      pathname.includes(id) ||
      children.some((p) => pathname.includes(p.id)));
  const creating =
    folder?.projectId === project.id &&
    (folder.parentId || null) === (item?.id || null);
  const href = `/workspace/projects/${project.id}${item ? `/pages/${id}` : ""}`;
  const selected = pathname === href;
  const editable = owner || item?.authorId === actorId;
  const actions = [
    ...(item?.kind === "page"
      ? [{ label: "Discussion", href: `${href}?discussion=1` }]
      : contentActions(project.id, item?.id)),
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
          ref={row}
          render={<div />}
          className="tree-row"
          data-selected={selected || undefined}
          style={{ paddingLeft: 8 + Math.min(depth, 5) * 14 }}
        >
          <button
            className="tree-disclosure"
            aria-label={`${expanded ? "Collapse" : "Expand"} ${title}`}
            aria-expanded={expanded}
            onClick={() => onToggle(id, !expanded)}
            disabled={!children.length && !creating}
          >
            {item ? <PageIcon page={item} /> : <Icon name="Folder" />}
            {(!!children.length || creating) && (
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
      {expanded &&
        (!!children.length || creating) &&
        !ancestors.includes(id) && (
          <ul className="content-tree">
            {creating && folder && (
              <li
                className="tree-draft"
                style={{ paddingLeft: 8 + Math.min(depth + 1, 5) * 14 }}
              >
                <InlineName
                  key={folder.clientKey}
                  kind="folder"
                  onCancel={(restoreFocus) => {
                    onCancel();
                    if (restoreFocus)
                      row.current
                        ?.querySelector<HTMLButtonElement>(
                          ".tree-actions button",
                        )
                        ?.focus();
                  }}
                  onCreate={onCreate}
                />
              </li>
            )}
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
                expandedRows={expandedRows}
                onToggle={onToggle}
                folder={folder}
                onCancel={onCancel}
                onCreate={onCreate}
              />
            ))}
          </ul>
        )}
    </li>
  );
}
export function ContentTree({
  initialFolder,
  onNavigate,
  projects,
  items,
  owner,
  actorId,
}: {
  projects: Project[];
  items: PageTreeItem[];
  owner: boolean;
  actorId: string;
  initialFolder?: FolderDraft;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [folder, setFolder] = useState(initialFolder);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        initialFolder
          ? folderPath(items, initialFolder).map((id) => [id, true])
          : [],
      ),
  );
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
  useEffect(() => {
    const create = (event: Event) => {
      if (window.matchMedia("(max-width: 900px)").matches !== !!onNavigate)
        return;
      const draft = (event as CustomEvent<FolderDraft>).detail;
      setFolder(draft);
      setExpandedRows((current) => ({
        ...current,
        ...Object.fromEntries(
          folderPath([...items, ...saved], draft).map((id) => [id, true]),
        ),
      }));
    };
    const cancel = () => setFolder(undefined);
    window.addEventListener("commons:create-folder", create);
    window.addEventListener("commons:create-project", cancel);
    return () => {
      window.removeEventListener("commons:create-folder", create);
      window.removeEventListener("commons:create-project", cancel);
    };
  }, [items, saved, onNavigate]);
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
          expandedRows={expandedRows}
          onToggle={(id, expanded) =>
            setExpandedRows((current) => ({ ...current, [id]: expanded }))
          }
          folder={folder}
          onCancel={() => setFolder(undefined)}
          onCreate={async (name) => {
            if (!folder) return;
            const result = await createSidebarFolder(
              folder.projectId,
              folder.parentId,
              name,
              folder.clientKey,
            );
            if (result.page) {
              window.dispatchEvent(
                new CustomEvent("commons:page-saved", { detail: result.page }),
              );
              setFolder(undefined);
              onNavigate?.();
              router.push(
                `/workspace/projects/${result.page.projectId}/pages/${result.page.id}`,
              );
            }
            return result.error;
          }}
        />
      ))}
    </ul>
  );
}
