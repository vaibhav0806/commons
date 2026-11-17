"use client";

import { useEffect, useRef, useState } from "react";
import { Menu } from "@base-ui/react/menu";
import type { ProjectFile } from "@/lib/store";
import type {
  PageKind,
  PageStatus,
  PageTreeItem,
  WorkspacePage,
} from "@/lib/store";
import { DocumentEditor, type DocumentEditorHandle } from "./document-editor";
import { usePageAutosave } from "./use-page-autosave";
import { SelectField } from "./ui/select-field";
import { FileUpload } from "./file-upload";
import { useFeedback } from "./feedback";

export function PageEditor({
  page,
  pages,
  files,
  projectId,
  kind = "page",
  parentId,
  status = "Idea",
  actorId,
}: {
  page?: WorkspacePage;
  actorId?: string;
  pages: PageTreeItem[];
  kind?: PageKind;
  parentId?: string;
  status?: PageStatus;
  files: Pick<ProjectFile, "id" | "name" | "mimeType">[];
  projectId: string;
}) {
  const [body, setBody] = useState(page?.body || "");
  const [source, setSource] = useState(false);
  const feedback = useFeedback();
  const [filePicker, setFilePicker] = useState(false);
  const [location, setLocation] = useState(false);
  const [ready, setReady] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const editor = useRef<DocumentEditorHandle | null>(null);
  const hidden = useRef<HTMLInputElement>(null);
  const importer = useRef<HTMLInputElement>(null);
  const title = useRef<HTMLTextAreaElement>(null);
  const [parent, setParent] = useState(page?.parentId || parentId || "");
  const autosave = usePageAutosave({
    enabled: !!actorId && (page?.kind || kind) === "page",
    ready,
    uploading: uploading || attachmentUploading,
    actorId: actorId || "",
    projectId,
    page,
    parentId,
    read: () => ({
      title: title.current?.value || "",
      body: source ? body : (editor.current?.markdown() ?? body),
      parentId: parent || null,
      status: page?.status || status,
    }),
    restore: (draft) => {
      if (title.current) {
        title.current.value = draft.title;
        title.current.style.height = "auto";
        title.current.style.height = `${title.current.scrollHeight}px`;
      }
      setBody(draft.body);
      editor.current?.replace(draft.body);
      setParent(draft.parentId || "");
    },
  });
  const { changed } = autosave;
  useEffect(() => {
    changed();
  }, [body, parent, uploading, attachmentUploading, ready, changed]);
  useEffect(() => {
    const node = title.current;
    if (!node) return;
    const resize = () => {
      node.style.height = "auto";
      node.style.height = `${node.scrollHeight}px`;
    };
    let width = node.clientWidth;
    const observer = new ResizeObserver(() => {
      if (node.clientWidth !== width) {
        width = node.clientWidth;
        resize();
      }
    });
    observer.observe(node);
    resize();
    void document.fonts.ready.then(resize);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const form = hidden.current?.form;
    const flush = (event: Event) => {
      if (uploading) {
        event.preventDefault();
        feedback.error("Wait for the image to finish uploading.", {
          id: "page-editor-submit",
          title: "Finish uploading first",
        });
        return;
      }
      const value = source ? body : (editor.current?.markdown() ?? body);
      if (value.length > 100000) {
        event.preventDefault();
        feedback.error("Pages support up to 100,000 characters.", {
          id: "page-editor-submit",
          title: "Page is too long",
        });
      } else {
        feedback.dismiss("page-editor-submit");
      }
      if (hidden.current) hidden.current.value = JSON.stringify(value);
    };
    form?.addEventListener("submit", flush, true);
    return () => form?.removeEventListener("submit", flush, true);
  }, [body, feedback, source, uploading]);
  function insert(value: string) {
    if (source) setBody(body + value);
    else editor.current?.insert(value);
  }
  if ((page?.kind || kind) !== "page")
    return (
      <>
        <input type="hidden" name="kind" value={page?.kind || kind} />
        <label className="field">
          <span>Name</span>
          <input
            name="title"
            defaultValue={page?.title}
            maxLength={160}
            required
            autoFocus
            placeholder="Folder name"
          />
        </label>
        {page ? (
          <SelectField
            label="Inside"
            name="parentId"
            defaultValue={page?.parentId || parentId || ""}
            options={[
              { value: "", label: "Top level in this project" },
              ...pages
                .filter((p) => p.id !== page?.id)
                .map((p) => ({ value: p.id, label: p.title })),
            ]}
          />
        ) : (
          <input type="hidden" name="parentId" value={parentId || ""} />
        )}
        {page ? (
          <label className="field">
            <span>Description</span>
            <textarea
              name="body"
              defaultValue={page?.body}
              maxLength={100000}
              rows={3}
            />
          </label>
        ) : (
          <input type="hidden" name="body" value="" />
        )}
      </>
    );
  return (
    <div className="form-stack document-form">
      <input type="hidden" name="status" value={page?.status || status} />
      <input type="hidden" name="kind" value={page?.kind || kind} />
      <input
        ref={hidden}
        name="bodyJson"
        type="hidden"
        value={JSON.stringify(body)}
      />
      {actorId && (
        <div className="document-save-status">
          <span role="status" data-autosave-status>
            {autosave.status}
          </span>
          {autosave.pageId && (
            <a
              href={`/workspace/projects/${projectId}/pages/${autosave.pageId}`}
            >
              Done
            </a>
          )}
        </div>
      )}
      <div className="document-edit-heading">
        <textarea
          ref={title}
          rows={1}
          onInput={(event) => {
            event.currentTarget.value = event.currentTarget.value.replace(
              /[\r\n]+/g,
              " ",
            );
            event.currentTarget.style.height = "auto";
            event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`;
            changed();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              event.preventDefault();
              event.currentTarget
                .closest(".document-page")
                ?.querySelector<HTMLElement>(
                  '.document-editor [contenteditable="true"]',
                )
                ?.focus();
            }
          }}
          className="document-title-input"
          name="title"
          aria-label="Page title"
          defaultValue={page?.title}
          maxLength={160}
          required
          autoFocus
          placeholder="Untitled page"
        />
        <Menu.Root>
          <Menu.Trigger className="icon-button" aria-label="Page options">
            ⋯
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner
              align="end"
              sideOffset={8}
              className="entity-menu-positioner"
            >
              <Menu.Popup className="entity-menu-items">
                <Menu.Item
                  disabled={source && !ready}
                  onClick={() => {
                    if (source) editor.current?.replace(body);
                    else setBody(editor.current?.markdown() ?? body);
                    setSource(!source);
                  }}
                >
                  {source ? "Document" : "Markdown source"}
                </Menu.Item>
                <Menu.Item
                  disabled={!ready}
                  onClick={() => importer.current?.click()}
                >
                  Import Markdown
                </Menu.Item>
                <Menu.Item
                  disabled={!ready}
                  onClick={() => setFilePicker(!filePicker)}
                >
                  Attach a file
                </Menu.Item>
                {page && (
                  <Menu.Item onClick={() => setLocation(!location)}>
                    Move to…
                  </Menu.Item>
                )}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </div>
      {page && (
        <div hidden={!location}>
          <SelectField
            label="Inside"
            name="parentId"
            value={parent}
            onValueChange={setParent}
            options={[
              { value: "", label: "Project" },
              ...pages
                .filter((p) => p.id !== page.id)
                .map((p) => ({ value: p.id, label: p.title })),
            ]}
          />
        </div>
      )}
      {!page && <input type="hidden" name="parentId" value={parentId || ""} />}
      {filePicker && (
        <section className="editor-file-picker">
          <div className="section-title">
            <h3>Insert a project file</h3>
            <button
              type="button"
              className="text-button"
              onClick={() => setFilePicker(false)}
            >
              Close
            </button>
          </div>
          {files.map((file) => (
            <button
              key={file.id}
              type="button"
              className="context-row compact-row"
              onClick={() => {
                const image = file.mimeType.startsWith("image/");
                insert(
                  `\n${image ? "!" : ""}[${file.name.replace(/[\[\]]/g, "")}](/api/files/${file.id}${image ? "?preview=1" : ""})\n`,
                );
                setFilePicker(false);
              }}
            >
              {file.name}
            </button>
          ))}
          <FileUpload
            projectId={projectId}
            onUploading={setAttachmentUploading}
            onUploaded={(file) => {
              const image = file.mimeType.startsWith("image/");
              insert(
                `\n${image ? "!" : ""}[${file.name.replace(/[\[\]\\]/g, "")}](${file.url}${image ? "?preview=1" : ""})\n`,
              );
            }}
          />
        </section>
      )}
      <input
        ref={importer}
        type="file"
        accept=".md,.markdown,.txt"
        hidden
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          if (file.size > 400000) {
            feedback.error("Import a Markdown file smaller than 400 KB.", {
              id: "page-import",
              title: "Couldn’t import Markdown",
            });
            return;
          }
          try {
            const text = await file.text();
            if (text.length > 100000)
              throw new Error("Pages support up to 100,000 characters.");
            setBody(text);
            editor.current?.replace(text);
            feedback.dismiss("page-import");
          } catch (e) {
            feedback.error(
              e instanceof Error ? e.message : "The file could not be read.",
              { id: "page-import", title: "Couldn’t import Markdown" },
            );
          }
          event.target.value = "";
        }}
      />
      <div hidden={source}>
        <DocumentEditor
          initialValue={page?.body || ""}
          projectId={projectId}
          ref={editor}
          onChange={setBody}
          onError={(message) => {
            if (message) {
              feedback.error(message, {
                id: "page-image",
                title: "Couldn’t add image",
              });
            }
          }}
          onReady={setReady}
          onUploading={setUploading}
        />
      </div>
      {source && (
        <textarea
          className="document-source"
          aria-label="Markdown source"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={100000}
          rows={18}
          spellCheck={false}
        />
      )}
      {actorId && autosave.error && (
        <div className="document-save-error" role="alert">
          <p>{autosave.error}</p>
          {autosave.conflict ? (
            <a
              href={`/workspace/projects/${projectId}/pages/${autosave.pageId || page?.id}`}
              target="_blank"
              rel="noreferrer"
            >
              Compare latest page ↗
            </a>
          ) : (
            <button type="button" onClick={() => void autosave.flush()}>
              Retry save
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              const text = source ? body : (editor.current?.markdown() ?? body);
              const url = URL.createObjectURL(
                new Blob([text], { type: "text/markdown" }),
              );
              const link = document.createElement("a");
              link.href = url;
              link.download = "commons-draft.md";
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download draft
          </button>
        </div>
      )}
      {uploading && (
        <p className="meta" role="status">
          Uploading image…
        </p>
      )}
    </div>
  );
}
