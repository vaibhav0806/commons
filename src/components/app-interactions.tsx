"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { ConnectForm } from "./forms";
import { DialogSurface } from "./ui/dialog-surface";
import { Icon } from "./brand";
import type { Project, SearchResult } from "@/lib/store";

type Interactions = {
  connect: (projectId?: string) => void;
  search: () => void;
};
const Context = createContext<Interactions | null>(null);

export function AppInteractions({
  children,
  projects,
  owner,
  origin,
}: {
  children: ReactNode;
  projects: Project[];
  owner: boolean;
  origin: string;
}) {
  const pathname = usePathname(),
    router = useRouter();
  const currentProject =
    projects.find((project) => pathname.includes(project.id)) || projects[0];
  const [connectOpen, setConnectOpen] = useState(false),
    [scope, setScope] = useState<string>();
  const [searchOpen, setSearchOpen] = useState(false),
    [query, setQuery] = useState(""),
    [index, setIndex] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]),
    [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const connectReturn = useRef<HTMLElement | null>(null),
    searchReturn = useRef<HTMLElement | null>(null),
    searchInput = useRef<HTMLInputElement | null>(null);
  const openSearch = () => {
    if (!currentProject) return;
    searchReturn.current = document.activeElement as HTMLElement;
    setQuery("");
    setIndex(0);
    setResults([]);
    setStatus("loading");
    setSearchOpen(true);
  };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k" &&
        currentProject
      ) {
        event.preventDefault();
        if (searchOpen) setSearchOpen(false);
        else {
          searchReturn.current = document.activeElement as HTMLElement;
          setQuery("");
          setIndex(0);
          setResults([]);
          setStatus("loading");
          setSearchOpen(true);
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [currentProject, searchOpen]);
  useEffect(() => {
    if (!searchOpen || !currentProject) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?projectId=${currentProject.id}&q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Search unavailable");
        const data: { results: SearchResult[] } = await response.json();
        if (!controller.signal.aborted) {
          setResults(data.results);
          setStatus("ready");
        }
      } catch {
        if (!controller.signal.aborted) setStatus("error");
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchOpen, currentProject, query]);
  function visit(result: SearchResult) {
    setSearchOpen(false);
    router.push(result.href);
  }
  return (
    <Context.Provider
      value={{
        search: openSearch,
        connect: (projectId) => {
          if (!owner) return;
          connectReturn.current = document.activeElement as HTMLElement;
          setScope(projectId || currentProject?.id);
          setConnectOpen(true);
        },
      }}
    >
      {children}
      {owner && (
        <DialogSurface
          open={connectOpen}
          onOpenChange={setConnectOpen}
          title="Connect an agent"
          description="Choose its access. Your agent joins and introduces itself."
          finalFocus={connectReturn}
        >
          <ConnectForm
            key={scope || "workspace"}
            projects={projects}
            origin={origin}
            initialProject={scope}
          />
        </DialogSurface>
      )}
      <DialogSurface
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title={
          currentProject ? `Search ${currentProject.name}` : "Search project"
        }
        variant="command"
        initialFocus={searchInput}
        finalFocus={searchReturn}
      >
        <div className="command-input">
          <Icon name="MagnifyingGlass" />
          <input
            ref={searchInput}
            role="combobox"
            aria-label="Search project"
            aria-autocomplete="list"
            aria-expanded={searchOpen}
            aria-controls="project-search-results"
            aria-activedescendant={
              status === "ready" && results[index]
                ? `search-result-${index}`
                : undefined
            }
            value={query}
            maxLength={200}
            autoComplete="off"
            placeholder="Find pages, files, notes and people…"
            onChange={(event) => {
              setQuery(event.target.value);
              setIndex(0);
              setStatus("loading");
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                setIndex(
                  (value) =>
                    (value +
                      (event.key === "ArrowDown" ? 1 : -1) +
                      results.length) %
                    Math.max(1, results.length),
                );
              }
              if (
                event.key === "Enter" &&
                status === "ready" &&
                results[index]
              ) {
                event.preventDefault();
                visit(results[index]);
              }
            }}
          />
        </div>
        <div
          id="project-search-results"
          className="command-results"
          role="listbox"
          aria-label="Project search results"
          aria-busy={status === "loading"}
        >
          {status === "loading" && <p role="status">Searching this project…</p>}
          {status === "error" && (
            <p role="status">
              Search couldn’t load. Try another search or reopen it.
            </p>
          )}
          {status === "ready" && !results.length && (
            <p role="status">No matching context in this project.</p>
          )}
          {status === "ready" &&
            results.map((result, i) => (
              <a
                key={`${result.kind}-${result.id}`}
                id={`search-result-${i}`}
                className="command-result"
                href={result.href}
                role="option"
                tabIndex={-1}
                aria-selected={index === i}
                onMouseMove={() => setIndex(i)}
                onClick={(event) => {
                  event.preventDefault();
                  visit(result);
                }}
              >
                <Icon
                  name={
                    result.kind === "note"
                      ? "Note"
                      : result.kind === "agent"
                        ? "UsersThree"
                        : "Folder"
                  }
                />
                <span>
                  <strong>{result.title}</strong>
                  <small>{result.description}</small>
                </span>
                <span className="command-kind">{result.kind}</span>
              </a>
            ))}
        </div>
        <footer className="command-footer">
          <span>↑ ↓ navigate · Enter open</span>
          <span>Esc close</span>
        </footer>
      </DialogSurface>
    </Context.Provider>
  );
}

export function ConnectAgentButton({
  children,
  className = "button",
  projectId,
  label,
}: {
  children: ReactNode;
  className?: string;
  projectId?: string;
  label?: string;
}) {
  const interactions = useContext(Context);
  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      onClick={() => interactions?.connect(projectId)}
    >
      {children}
    </button>
  );
}
export function CommandSearchButton() {
  const interactions = useContext(Context);
  return (
    <button
      type="button"
      className="command-shortcut"
      aria-label="Open project search"
      aria-keyshortcuts="Meta+K Control+K"
      title="Search project (⌘K / Ctrl+K)"
      onClick={() => interactions?.search()}
    >
      <Icon name="MagnifyingGlass" />
      <kbd>⌘K</kbd>
    </button>
  );
}
