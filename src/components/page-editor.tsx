"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { ProjectFile } from "@/lib/store";
import type { WorkspacePage } from "@/lib/store";
import { MarkdownContent } from "./markdown";
import { SelectField } from "./ui/select-field";
import { Icon } from "./brand";

const blocks = [
  ["Heading", "\n## Heading\n"],
  ["Bulleted list", "\n- First item\n- Second item\n"],
  ["Checklist", "\n- [ ] First item\n- [ ] Second item\n"],
  ["Table", "\n| Item | Details |\n| --- | --- |\n| First item | Context |\n"],
  ["Code", "\n```text\nYour code here\n```\n"],
  ["Callout", "\n> Keep the important context close to the work.\n"],
  ["File or image", "\n[File name](/api/files/FILE_ID)\n"],
  ["Embed / link", "\n[Linked resource](https://example.com)\n"],
  ["Divider", "\n---\n"],
];
export function PageEditor({
  page,
  pages,
  files,
  projectId,
}: {
  page?: WorkspacePage;
  pages: WorkspacePage[];
  files: Pick<ProjectFile, "id" | "name" | "mimeType">[];
  projectId: string;
}) {
  const [body, setBody] = useState(page?.body || ""),
    [preview, setPreview] = useState(false),
    [menu, setMenu] = useState(false),
    [error, setError] = useState(""),
    [filePicker, setFilePicker] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null),
    importer = useRef<HTMLInputElement>(null);
  function insert(value: string) {
    const node = input.current;
    const start = node?.selectionStart ?? body.length,
      end = node?.selectionEnd ?? start;
    const from = body[start - 1] === "/" ? start - 1 : start;
    const next = body.slice(0, from) + value + body.slice(end);
    if (next.length > 100000) {
      setError("Pages support up to 100,000 characters.");
      return;
    }
    setBody(next);
    setMenu(false);
    setPreview(false);
    requestAnimationFrame(() => {
      node?.focus();
      node?.setSelectionRange(from + value.length, from + value.length);
    });
  }
  return (
    <>
      <label className="field">
        <span>Page title</span>
        <input
          name="title"
          defaultValue={page?.title}
          maxLength={160}
          required
          placeholder="Untitled page"
        />
      </label>
      <SelectField
        label="Parent page"
        name="parentId"
        defaultValue={page?.parentId || ""}
        options={[
          { value: "", label: "Top level in this project" },
          ...pages
            .filter((p) => p.id !== page?.id)
            .map((p) => ({ value: p.id, label: p.title })),
        ]}
      />
      <div className="editor-toolbar">
        <div className="editor-modes">
          <button
            type="button"
            aria-pressed={!preview}
            onClick={() => setPreview(false)}
          >
            Write
          </button>
          <button
            type="button"
            aria-pressed={preview}
            onClick={() => setPreview(true)}
          >
            Preview
          </button>
        </div>
        <div className="editor-insert">
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setPreview(false);
              setMenu(!menu);
            }}
            aria-expanded={menu}
          >
            <Icon name="Plus" />
            Insert block
          </button>
          {menu && (
            <div className="block-menu" aria-label="Insert a block">
              {blocks.map(([label, value]) => (
                <button
                  type="button"
                  key={label}
                  onClick={() => {
                    if (label === "File or image") {
                      setMenu(false);
                      setFilePicker(true);
                    } else insert(value);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          className="text-button"
          onClick={() => importer.current?.click()}
        >
          Import Markdown
        </button>
      </div>
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
          <Link
            className="text-link"
            target="_blank"
            href={`/workspace/projects/${projectId}/files`}
          >
            Upload or browse more files
          </Link>
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
            setError("Import a Markdown file smaller than 400 KB.");
            return;
          }
          try {
            const text = await file.text();
            if (text.length > 100000)
              throw new Error("Pages support up to 100,000 characters.");
            setBody(text);
            setError("");
          } catch (e) {
            setError(
              e instanceof Error ? e.message : "The file could not be read.",
            );
          }
          event.target.value = "";
        }}
      />
      {preview ? (
        <>
          <input name="body" type="hidden" value={body} />
          <div className="editor-preview">
            {body ? (
              <MarkdownContent body={body} />
            ) : (
              <p className="meta">Your page preview will appear here.</p>
            )}
          </div>
        </>
      ) : (
        <label className="field">
          <span className="visually-hidden">Page content</span>
          <textarea
            ref={input}
            name="body"
            aria-label="Page content"
            className="markdown-editor"
            rows={16}
            maxLength={100000}
            value={body}
            onChange={(event) => {
              setBody(event.target.value);
              if (
                event.target.value[event.target.selectionStart - 1] === "/" &&
                (event.target.selectionStart === 1 ||
                  /\s/.test(
                    event.target.value[event.target.selectionStart - 2],
                  ))
              )
                setMenu(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setMenu(false);
            }}
            placeholder="Write in Markdown, paste content or type / to insert a block…"
          />
        </label>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <p className="meta">
        Markdown supports headings, lists, tables, code, quotes, images and
        links. Changes are saved when you choose Save page.
      </p>
    </>
  );
}
