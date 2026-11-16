"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SelectField } from "./ui/select-field";
import { Icon } from "./brand";
import { createSidebarProject } from "@/app/actions";
import { InlineName } from "./inline-name";
import { ContentTree, type FolderDraft } from "./content-tree";
import type { PageTreeItem, Project } from "@/lib/store";

export function WorkspaceNav({
  projects,
  owner,
  items,
  actorId,
  onNavigate,
  initialCreating = false,
  initialFolder,
}: {
  projects: Project[];
  owner: boolean;
  items: PageTreeItem[];
  actorId: string;
  onNavigate?: () => void;
  initialCreating?: boolean;
  initialFolder?: FolderDraft;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(initialCreating);
  const createButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!owner)
      void fetch("/api/agent/session", { method: "POST" }).catch(() => {});
  }, [owner]);
  useEffect(() => {
    const create = () => {
      if (owner && window.matchMedia("(min-width: 901px)").matches)
        setCreating(true);
    };
    window.addEventListener("commons:create-project", create);
    return () => window.removeEventListener("commons:create-project", create);
  }, [owner]);
  const pathname = usePathname();
  return (
    <>
      <nav className="nav-group" aria-label="Workspace">
        <Link
          className="nav-item"
          href="/workspace"
          aria-current={pathname === "/workspace" ? "page" : undefined}
        >
          <Icon name="HouseLine" />
          Home
        </Link>
      </nav>
      <div>
        <div className="nav-section-heading">
          <p className="nav-heading">Projects</p>
          {owner && (
            <button
              ref={createButton}
              type="button"
              className="icon-button"
              aria-label="New project"
              aria-expanded={creating}
              aria-disabled={creating}
              onClick={() => {
                if (!creating) setCreating(true);
              }}
            >
              <Icon name="Plus" />
            </button>
          )}
        </div>
        <nav className="nav-group" aria-label="Projects">
          {creating && (
            <InlineName
              kind="project"
              onCancel={(restoreFocus) => {
                if (restoreFocus) createButton.current?.focus();
                setCreating(false);
              }}
              onCreate={async (name) => {
                const result = await createSidebarProject(name);
                if (result.projectId) {
                  setCreating(false);
                  onNavigate?.();
                  router.push(`/workspace/projects/${result.projectId}`);
                }
                return result.error;
              }}
            />
          )}
          <ContentTree
            initialFolder={initialFolder}
            onNavigate={onNavigate}
            projects={projects}
            items={items}
            owner={owner}
            actorId={actorId}
          />
        </nav>
      </div>
    </>
  );
}

export function WorkspaceActions({ owner }: { owner: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="nav-group" aria-label="Workspace actions">
      <Link
        className="nav-item"
        href="/workspace/agents"
        aria-current={pathname === "/workspace/agents" ? "page" : undefined}
      >
        <Icon name="UsersThree" />
        Agents
      </Link>
      <Link
        className="nav-item"
        href="/workspace/settings"
        aria-current={pathname === "/workspace/settings" ? "page" : undefined}
      >
        <Icon name="GearSix" /> Settings
      </Link>
      {!owner && (
        <Link
          className="nav-item"
          href="/workspace/connection"
          aria-current={
            pathname === "/workspace/connection" ? "page" : undefined
          }
        >
          <Icon name="Plus" />
          MCP connection
        </Link>
      )}
    </nav>
  );
}

export function MobileProjectSwitcher({ projects }: { projects: Project[] }) {
  const pathname = usePathname(),
    router = useRouter();
  const selected = projects.find((p) => pathname.includes(p.id))?.id || "";
  return (
    <div className="mobile-project-switcher">
      <SelectField
        label="Switch project"
        hiddenLabel
        value={selected}
        placeholder="Your projects"
        options={projects.map((project) => ({
          value: project.id,
          label: project.name,
        }))}
        onValueChange={(value) => router.push(`/workspace/projects/${value}`)}
      />
    </div>
  );
}

export function NewProjectButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="button"
      onClick={() => window.dispatchEvent(new Event("commons:create-project"))}
    >
      {children}
    </button>
  );
}
