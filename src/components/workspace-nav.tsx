"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SelectField } from "./ui/select-field";
import { Icon } from "./brand";
import { createSidebarProject } from "@/app/actions";
import { ContentTree } from "./content-tree";
import type { PageTreeItem, Project } from "@/lib/store";

export function WorkspaceNav({
  projects,
  owner,
  items,
  actorId,
  onNavigate,
}: {
  projects: Project[];
  owner: boolean;
  items: PageTreeItem[];
  actorId: string;
  onNavigate?: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const createButton = useRef<HTMLButtonElement>(null);
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
          <Icon name="HouseLine" />
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
            <InlineProject
              onCancel={() => {
                createButton.current?.focus();
                setCreating(false);
              }}
              onCreated={() => {
                setCreating(false);
                onNavigate?.();
              }}
            />
          )}
          <ContentTree
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

function InlineProject({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const submitting = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const hintId = useId();
  useEffect(() => input.current?.focus(), []);
  return (
    <form
      className="inline-project"
      aria-label="Create project"
      aria-busy={pending}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          if (!submitting.current) onCancel();
        }
      }}
      onSubmit={(event) => {
        event.preventDefault();
        if (submitting.current) return;
        if (name.trim().length < 2) {
          setError("Use at least 2 characters.");
          input.current?.focus();
          return;
        }
        submitting.current = true;
        setError(undefined);
        startTransition(async () => {
          try {
            const result = await createSidebarProject(name.trim());
            if (result.projectId) {
              onCreated();
              router.push(`/workspace/projects/${result.projectId}`);
            } else {
              setError(result.error);
              input.current?.focus();
            }
          } catch {
            setError("Couldn’t create this project. Try again.");
            input.current?.focus();
          } finally {
            submitting.current = false;
          }
        });
      }}
    >
      <div className="inline-project-field">
        <Icon name="Folder" />
        <input
          ref={input}
          aria-label="Project name"
          aria-describedby={hintId}
          aria-invalid={!!error}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError(undefined);
          }}
          placeholder="Project name"
          maxLength={60}
          readOnly={pending}
          autoComplete="off"
        />
      </div>
      <div className="inline-project-controls">
        <span
          id={hintId}
          role={error ? "alert" : "status"}
          className={error ? "danger-text" : undefined}
        >
          {error || (pending ? "Creating…" : "Enter to create · Esc to cancel")}
        </span>
        <button
          type="button"
          className="icon-button"
          aria-label="Cancel new project"
          disabled={pending}
          onClick={onCancel}
        >
          <Icon name="X" />
        </button>
        <button
          type="submit"
          className="icon-button"
          aria-label="Create project"
          disabled={pending || !name.trim()}
        >
          <Icon name="Check" />
        </button>
      </div>
    </form>
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
        Agents & access
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
