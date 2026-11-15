"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  initialCreating = false,
}: {
  projects: Project[];
  owner: boolean;
  items: PageTreeItem[];
  actorId: string;
  onNavigate?: () => void;
  initialCreating?: boolean;
}) {
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
            <InlineProject
              onCancel={(restoreFocus) => {
                if (restoreFocus) createButton.current?.focus();
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
  onCancel: (restoreFocus: boolean) => void;
  onCreated: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const submitting = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => input.current?.focus(), []);
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (!submitting.current && !form.current?.contains(event.target as Node))
        onCancel(false);
    };
    document.addEventListener("pointerdown", dismiss, true);
    return () => document.removeEventListener("pointerdown", dismiss, true);
  }, [onCancel]);
  return (
    <form
      ref={form}
      className="inline-project"
      aria-label="Create project"
      aria-busy={pending}
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing) {
          if (event.key === "Enter") event.preventDefault();
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          if (!submitting.current) onCancel(true);
        }
      }}
      onSubmit={(event) => {
        event.preventDefault();
        if (submitting.current) return;
        if (!name.trim()) {
          onCancel(true);
          return;
        }
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
          aria-describedby={error ? errorId : undefined}
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
          enterKeyHint="done"
        />
      </div>
      {error && (
        <p id={errorId} role="alert" className="inline-project-error">
          {error}
        </p>
      )}
      {pending && (
        <span className="visually-hidden" role="status">
          Creating project
        </span>
      )}
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
