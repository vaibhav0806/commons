"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PageInput, WorkspacePage } from "@/lib/store";

type Draft = Pick<PageInput, "title" | "body" | "parentId"> & {
  status: WorkspacePage["status"];
};
type StoredDraft = {
  id: string | null;
  version: number | null;
  clientKey: string;
  draft: Draft;
  base: string;
};
function serialize(draft: Draft) {
  return JSON.stringify({
    title: draft.title.trim() || "Untitled page",
    body: draft.body,
    parentId: draft.parentId,
    status: draft.status,
  });
}

export function usePageAutosave(options: {
  enabled: boolean;
  ready: boolean;
  uploading: boolean;
  actorId: string;
  projectId: string;
  page?: WorkspacePage;
  parentId?: string;
  read: () => Draft;
  restore: (draft: Draft) => void;
}) {
  const latest = useRef(options);
  const state = useRef<StoredDraft | null>(null);
  const storageKey = useRef("");
  const busy = useRef<Promise<boolean> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blocked = useRef(false);
  const initialized = useRef(false);
  const mounted = useRef(true);
  const [status, setStatus] = useState(options.page ? "Saved" : "");
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [pageId, setPageId] = useState(options.page?.id);
  useEffect(() => {
    latest.current = options;
  });

  const persist = useCallback(() => {
    if (!state.current) return;
    if (mounted.current) state.current.draft = latest.current.read();
    try {
      if (serialize(state.current.draft) === state.current.base)
        sessionStorage.removeItem(storageKey.current);
      else
        sessionStorage.setItem(
          storageKey.current,
          JSON.stringify(state.current),
        );
    } catch {
      /* Saving to the server still works if browser storage is unavailable. */
    }
  }, []);

  const flush = useCallback(async (): Promise<boolean> => {
    if (timer.current) clearTimeout(timer.current);
    if (!initialized.current || !state.current) return true;
    if (busy.current) return busy.current;
    if (blocked.current) return false;
    if (latest.current.uploading) return false;
    const run = async () => {
      while (true) {
        persist();
        const current = state.current!;
        if (serialize(current.draft) === current.base) {
          setStatus(current.id ? "Saved" : "");
          return true;
        }
        setStatus("Saving…");
        setError("");
        const snapshot = { ...current, draft: { ...current.draft } };
        try {
          const response = await fetch(
            `/api/projects/${latest.current.projectId}/pages`,
            {
              method: "POST",
              signal: AbortSignal.timeout(15000),
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(snapshot),
            },
          );
          const result = await response.json();
          if (!response.ok) {
            if (response.status === 409) {
              blocked.current = true;
              setConflict(true);
            }
            throw new Error(
              result.error || "Couldn’t save this page. Try again.",
            );
          }
          const saved = result.page as WorkspacePage;
          current.id = saved.id;
          current.version = saved.version;
          current.base = serialize(saved);
          setPageId(saved.id);
          if (mounted.current)
            window.dispatchEvent(
              new CustomEvent("commons:page-saved", {
                detail: {
                  id: saved.id,
                  projectId: saved.projectId,
                  parentId: saved.parentId,
                  title: saved.title,
                  kind: saved.kind,
                  status: saved.status,
                  authorId: saved.authorId,
                },
              }),
            );
          if (!snapshot.id) {
            try {
              sessionStorage.removeItem(storageKey.current);
            } catch {}
            storageKey.current = `commons:page-draft:${latest.current.actorId}:${latest.current.projectId}:${saved.id}`;
            if (mounted.current)
              window.history.replaceState(
                null,
                "",
                `/workspace/projects/${saved.projectId}/pages/${saved.id}?edit=1`,
              );
          }
          persist();
          if (!mounted.current) return true;
          if (latest.current.uploading) {
            setStatus("Uploading…");
            return false;
          }
        } catch (cause) {
          persist();
          setStatus("Not saved");
          setError(
            cause instanceof Error
              ? cause.message
              : "Couldn’t save this page. Try again.",
          );
          return false;
        }
      }
    };
    busy.current = run();
    try {
      return await busy.current;
    } finally {
      busy.current = null;
    }
  }, [persist]);

  const changed = useCallback(() => {
    if (!initialized.current || !state.current) return;
    persist();
    if (blocked.current) return;
    if (timer.current) clearTimeout(timer.current);
    if (serialize(state.current.draft) === state.current.base) {
      setStatus(busy.current ? "Saving…" : state.current.id ? "Saved" : "");
      return;
    }
    setStatus(latest.current.uploading ? "Uploading…" : "Unsaved changes");
    timer.current = setTimeout(() => {
      void flush();
    }, 800);
  }, [flush, persist]);

  useEffect(() => {
    if (!options.enabled || !options.ready || initialized.current) return;
    initialized.current = true;
    const initial: Draft = {
      title: options.page?.title || "",
      body: options.page?.body || "",
      parentId: options.page?.parentId || options.parentId || null,
      status: latest.current.read().status,
    };
    storageKey.current = `commons:page-draft:${options.actorId}:${options.projectId}:${options.page?.id || `new:${options.parentId || "root"}`}`;
    state.current = {
      id: options.page?.id || null,
      version: options.page?.version || null,
      clientKey: crypto.randomUUID(),
      draft: initial,
      base: serialize(initial),
    };
    try {
      const raw = sessionStorage.getItem(storageKey.current);
      if (raw) {
        const stored = JSON.parse(raw) as StoredDraft;
        if (
          stored.draft &&
          typeof stored.draft.body === "string" &&
          typeof stored.draft.title === "string" &&
          stored.clientKey
        ) {
          state.current = stored;
          latest.current.restore(stored.draft);
          if (
            options.page &&
            (serialize(stored.draft) === serialize(options.page) ||
              stored.base === serialize(options.page))
          ) {
            stored.version = options.page.version;
            stored.base = serialize(options.page);
          }
          if (
            options.page &&
            stored.version !== options.page.version &&
            stored.base !== serialize(options.page)
          ) {
            blocked.current = true;
            // This effect hydrates an external session draft after the editor is ready.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setConflict(true);
            setStatus("Not saved");
            setError(
              "This page changed while you were away. Your recovered draft is here; compare it with the latest page before continuing.",
            );
          } else changed();
        }
      }
    } catch {
      /* A malformed or unavailable local draft does not block the editor. */
    }
  }, [
    options.enabled,
    options.ready,
    options.actorId,
    options.projectId,
    options.parentId,
    options.page,
    changed,
  ]);

  useEffect(() => {
    if (!options.enabled) return;
    mounted.current = true;
    const leave = (event: BeforeUnloadEvent) => {
      if (!initialized.current || !state.current) return;
      persist();
      if (
        latest.current.uploading ||
        busy.current ||
        serialize(state.current.draft) !== state.current.base
      ) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const navigate = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (
        !link ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        link.target ||
        link.hasAttribute("download") ||
        link.origin !== location.origin ||
        link.getAttribute("href")?.startsWith("#")
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      void flush().then((saved) => {
        if (saved) window.location.assign(link.href);
      });
    };
    const visibility = () => {
      if (document.hidden) {
        persist();
        void flush();
      }
    };
    const online = () => {
      void flush();
    };
    window.addEventListener("beforeunload", leave);
    document.addEventListener("click", navigate, true);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("online", online);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      persist();
      mounted.current = false;
      window.removeEventListener("beforeunload", leave);
      document.removeEventListener("click", navigate, true);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("online", online);
    };
  }, [options.enabled, flush, persist]);

  return { status, error, conflict, pageId, changed, flush };
}
