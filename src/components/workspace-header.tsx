"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import type { PageTreeItem, Project } from "@/lib/store";
import { WorkspaceNav, WorkspaceActions } from "./workspace-nav";
import { DialogSurface } from "./ui/dialog-surface";
import { Icon } from "./brand";
import { SidebarToggle } from "./workspace-shell";

export function WorkspaceHeader({
  name,
  projects,
  owner,
  items,
  actorId,
}: {
  name: string;
  projects: Project[];
  owner: boolean;
  items: PageTreeItem[];
  actorId: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    const create = () => {
      if (owner && window.matchMedia("(max-width: 900px)").matches) {
        setCreating(true);
        setOpen(true);
      }
    };
    window.addEventListener("commons:create-project", create);
    return () => window.removeEventListener("commons:create-project", create);
  }, [owner]);
  const project = projects.find((p) => pathname.includes(p.id));
  const currentPage = items.find((item) =>
    pathname.endsWith(`/pages/${item.id}`),
  );
  const section =
    project?.name ||
    {
      agents: "Agents",
      settings: "Settings",
      new: "New project",
    }[pathname.split("/")[2] || ""] ||
    "Home";
  return (
    <>
      <header className="workspace-header">
        <SidebarToggle />
        <button
          className="icon-button mobile-menu-button"
          aria-label="Open workspace navigation"
          onClick={() => {
            setCreating(false);
            setOpen(true);
          }}
        >
          <Icon name="List" />
        </button>
        <div className="workspace-breadcrumb">
          {project ? (
            <Link href={`/workspace/projects/${project.id}`}>
              {project.name}
            </Link>
          ) : (
            <span>{section}</span>
          )}
          {currentPage && (
            <>
              <span aria-hidden="true">/</span>
              <span>{currentPage.title}</span>
            </>
          )}
        </div>
        <ThemeToggle />
      </header>
      <DialogSurface open={open} onOpenChange={setOpen} title={name}>
        <div
          className="mobile-workspace-links"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          <WorkspaceNav
            initialCreating={creating}
            projects={projects}
            items={items}
            actorId={actorId}
            owner={owner}
            onNavigate={() => setOpen(false)}
          />
          <WorkspaceActions owner={owner} />
        </div>
      </DialogSurface>
    </>
  );
}
