"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Icon } from "./brand";

export function InlineName({
  kind,
  onCancel,
  onCreate,
}: {
  kind: "project" | "folder";
  onCancel: (restoreFocus: boolean) => void;
  onCreate: (name: string) => Promise<string | undefined>;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const submitting = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      input.current?.focus();
      input.current?.scrollIntoView({ block: "nearest" });
    });
    return () => cancelAnimationFrame(frame);
  }, []);
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
      aria-label={`Create ${kind}`}
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
        if (kind === "project" && name.trim().length < 2) {
          setError("Use at least 2 characters.");
          input.current?.focus();
          return;
        }
        submitting.current = true;
        setError(undefined);
        startTransition(async () => {
          try {
            const error = await onCreate(name.trim());
            if (error) {
              setError(error);
              input.current?.focus();
            }
          } catch {
            setError(`Couldn’t create this ${kind}. Try again.`);
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
          aria-label={kind === "project" ? "Project name" : "Folder name"}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={!!error}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError(undefined);
          }}
          placeholder={kind === "project" ? "Project name" : "Folder name"}
          maxLength={kind === "project" ? 60 : 160}
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
          Creating {kind}
        </span>
      )}
    </form>
  );
}
