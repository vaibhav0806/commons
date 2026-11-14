"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SelectField } from "./ui/select-field";
import { Icon } from "./brand";
import { ConnectAgentButton } from "./app-interactions";
import type { Project } from "@/lib/store";

export function WorkspaceNav({
  projects,
  owner,
}: {
  projects: Project[];
  owner: boolean;
}) {
  useEffect(() => {
    if (!owner)
      void fetch("/api/agent/session", { method: "POST" }).catch(() => {});
  }, [owner]);
  const pathname = usePathname(),
    view = useSearchParams().get("view"),
    current = projects.find((p) => pathname.includes(p.id)) || projects[0];
  const home = current ? `/workspace/projects/${current.id}` : "/workspace";
  return (
    <>
      <nav className="nav-group" aria-label="Workspace">
        <Link
          className="nav-item"
          href="/workspace"
          aria-current={pathname === "/workspace" ? "page" : undefined}
        >
          <Icon name="House" />
          Home
        </Link>
        <Link
          className="nav-item"
          href="/workspace/unread"
          aria-current={
            pathname === "/workspace/unread" ||
            (pathname === home && view === "unread")
              ? "page"
              : undefined
          }
        >
          <Icon name="Clock" />
          Unread notes
        </Link>
      </nav>
      <div>
        <div className="nav-section-heading">
          <p className="nav-heading">Projects</p>
          {owner && (
            <Link
              href="/workspace/new"
              className="icon-button"
              aria-label="New project"
            >
              <Icon name="Plus" />
            </Link>
          )}
        </div>
        <nav className="nav-group" aria-label="Projects">
          {projects.map((p) => (
            <div key={p.id}>
              <Link
                className="nav-item"
                aria-current={pathname.includes(p.id) ? "page" : undefined}
                key={p.id}
                href={`/workspace/projects/${p.id}`}
              >
                <Icon name="Folder" />
                {p.name}
              </Link>
              {pathname.includes(p.id) && (
                <div className="project-nav-children">
                  <Link
                    className="nav-item"
                    href={`/workspace/projects/${p.id}/pages`}
                    aria-current={
                      pathname.includes("/pages") ? "page" : undefined
                    }
                  >
                    <Icon name="FileText" />
                    Pages
                  </Link>
                  <Link
                    className="nav-item"
                    href={`/workspace/projects/${p.id}/files`}
                    aria-current={
                      pathname.includes("/files") ? "page" : undefined
                    }
                  >
                    <Icon name="Folder" />
                    Files &amp; images
                  </Link>
                </div>
              )}
            </div>
          ))}
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
      {owner && (
        <Link
          className="nav-item"
          href="/workspace/graph"
          aria-current={pathname === "/workspace/graph" ? "page" : undefined}
        >
          <Icon name="LinkSimple" />
          Graph explorer
        </Link>
      )}
      <Link
        className="nav-item"
        href="/workspace/settings"
        aria-current={pathname === "/workspace/settings" ? "page" : undefined}
      >
        <Icon name="GearSix" /> Settings
      </Link>
      {owner ? (
        <ConnectAgentButton className="nav-item">
          <Icon name="Plus" />
          Connect an agent
        </ConnectAgentButton>
      ) : (
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
