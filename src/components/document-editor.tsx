"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";
import type { Crepe } from "@milkdown/crepe";
import { remarkHtmlBreaks } from "@/lib/remark-html-breaks";

export type DocumentEditorHandle = {
  markdown: () => string;
  replace: (value: string) => void;
  insert: (value: string) => void;
};

export function DocumentEditor({
  initialValue,
  projectId,
  ref,
  onChange,
  onError,
  onReady,
  onUploading,
}: {
  initialValue: string;
  projectId: string;
  ref: Ref<DocumentEditorHandle>;
  onChange: (value: string) => void;
  onError: (message: string) => void;
  onReady: (ready: boolean) => void;
  onUploading: (uploading: boolean) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const handle = useRef<DocumentEditorHandle | null>(null);
  useImperativeHandle(
    ref,
    () => ({
      markdown: () => handle.current?.markdown() ?? initialValue,
      replace: (value) => handle.current?.replace(value),
      insert: (value) => handle.current?.insert(value),
    }),
    [initialValue],
  );
  const callbacks = useRef({ onChange, onError, onReady, onUploading });
  useEffect(() => {
    callbacks.current = { onChange, onError, onReady, onUploading };
  }, [onChange, onError, onReady, onUploading]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let disposed = false;
    let instance: Crepe | undefined;
    const setup = async () => {
      const [
        { Crepe },
        { replaceAll, insert },
        { editorViewCtx, remarkPluginsCtx },
        { imageBlockSchema },
        { uploadConfig, uploadPlugin },
      ] = await Promise.all([
        import("@milkdown/crepe"),
        import("@milkdown/kit/utils"),
        import("@milkdown/kit/core"),
        import("@milkdown/kit/component/image-block"),
        import("@milkdown/kit/plugin/upload"),
      ]);
      if (disposed || !root.current) return;
      let original = initialValue;
      let baseline = "";
      let initialized = false;
      let uploads = 0;
      const upload = async (file: File) => {
        uploads += 1;
        callbacks.current.onUploading(true);
        try {
          if (file.size > 16777216)
            throw new Error("Each file can be up to 16 MB.");
          const data = new FormData();
          data.set("file", file);
          const response = await fetch(`/api/projects/${projectId}/files`, {
            method: "POST",
            body: data,
            signal: AbortSignal.timeout(120000),
          });
          const result = await response.json();
          if (!response.ok)
            throw new Error(result.error || "The file could not be uploaded.");
          callbacks.current.onError("");
          return result as { url: string; name: string; mimeType: string };
        } catch (error) {
          callbacks.current.onError(
            error instanceof Error
              ? error.message
              : "The file could not be uploaded.",
          );
          return null;
        } finally {
          uploads -= 1;
          if (!disposed) callbacks.current.onUploading(uploads > 0);
        }
      };
      instance = new Crepe({
        root: root.current,
        defaultValue: initialValue,
        features: { [Crepe.Feature.Latex]: false },
        featureConfigs: {
          [Crepe.Feature.Placeholder]: { text: "Start writing…", mode: "doc" },
          [Crepe.Feature.BlockEdit]: {
            advancedGroup: { math: null },
            textGroup: { h4: null, h5: null, h6: null },
          },
          [Crepe.Feature.ImageBlock]: {
            proxyDomURL: (url) =>
              !url
                ? ""
                : /^\/api\/files\/[a-f0-9-]{36}(\?preview=1)?$/.test(url)
                  ? url
                  : "data:image/svg+xml," +
                    encodeURIComponent(
                      '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="80"><text x="20" y="44" fill="#808896" font-size="14">External image · open the link to view</text></svg>',
                    ),
            onUpload: async (file) => {
              const result = await upload(file);
              if (result && !result.mimeType.startsWith("image/")) {
                callbacks.current.onError(
                  "Use PNG, JPEG, GIF or WebP for an inline image. This file was added to the project and can be attached as a link.",
                );
                return "";
              }
              return result ? `${result.url}?preview=1` : "";
            },
          },
        },
      });
      // Keep standard Markdown alt text; Crepe otherwise stores resize ratios there.
      instance.editor.config((ctx) => {
        ctx.update(remarkPluginsCtx, (plugins) => [
          ...plugins,
          { plugin: remarkHtmlBreaks, options: {} },
        ]);
        ctx.update(uploadConfig.key, (previous) => ({
          ...previous,
          enableHtmlFileUploader: true,
          uploader: async (files, schema) => {
            const nodes = [];
            for (const file of Array.from(files)) {
              const saved = await upload(file);
              if (!saved || disposed) continue;
              if (saved.mimeType.startsWith("image/")) {
                nodes.push(
                  schema.nodes["image-block"].create({
                    src: `${saved.url}?preview=1`,
                    alt: saved.name,
                    ratio: 1,
                  }),
                );
              } else {
                nodes.push(
                  schema.nodes.paragraph.create(
                    null,
                    schema.text(saved.name, [
                      schema.marks.link.create({ href: saved.url }),
                    ]),
                  ),
                );
              }
            }
            return nodes;
          },
        }));
        ctx.update(imageBlockSchema.key, (previous) => (ctx) => {
          const schema = previous(ctx);
          return {
            ...schema,
            attrs: {
              ...schema.attrs,
              alt: { default: "", validate: "string" },
            },
            parseMarkdown: {
              ...schema.parseMarkdown,
              runner: (state, node, type) =>
                state.addNode(type, {
                  src: node.url,
                  caption: node.title ?? "",
                  alt: node.alt ?? "",
                  ratio: 1,
                }),
            },
            toMarkdown: {
              ...schema.toMarkdown,
              runner: (state, node) => {
                state.openNode("paragraph");
                state.addNode("image", undefined, undefined, {
                  url: node.attrs.src,
                  title: node.attrs.caption || null,
                  alt: node.attrs.alt,
                });
                state.closeNode();
              },
            },
          };
        });
      });
      const markdown = () => {
        const current = instance!.getMarkdown();
        return current === baseline ? original : current;
      };
      instance.on((listener) =>
        listener.markdownUpdated(() => {
          if (initialized && !disposed) callbacks.current.onChange(markdown());
        }),
      );
      await instance.create();
      if (disposed) {
        await instance.destroy();
        return;
      }
      baseline = instance.getMarkdown();
      initialized = true;
      instance.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const filePaste = uploadPlugin.plugin();
        // File bytes must win over the HTML image URL in browser clipboards.
        view.setProps({
          handlePaste: (view, event, slice) => {
            if (!event.clipboardData?.files.length) return false;
            return (
              filePaste.props.handlePaste?.call(
                filePaste,
                view,
                event,
                slice,
              ) ?? false
            );
          },
        });
        view.dom.setAttribute("aria-label", "Page content");
        view.dom.setAttribute("role", "textbox");
        view.dom.setAttribute("aria-multiline", "true");
      });
      handle.current = {
        markdown,
        replace: (value) => {
          instance!.editor.action(replaceAll(value));
          original = value;
          baseline = instance!.getMarkdown();
          callbacks.current.onChange(value);
        },
        insert: (value) => {
          instance!.editor.action(insert(value));
          instance!.editor.action((ctx) => ctx.get(editorViewCtx).focus());
          callbacks.current.onChange(markdown());
        },
      };
      setReady(true);
      callbacks.current.onReady(true);
    };
    void setup().catch((error) => {
      if (!disposed) {
        setReady(true);
        callbacks.current.onError(
          error instanceof Error
            ? error.message
            : "The editor could not load. You can edit Markdown instead.",
        );
      }
    });
    return () => {
      disposed = true;
      handle.current = null;
      if (instance && initializedInstance(instance)) void instance.destroy();
    };
  }, [initialValue, projectId]);
  return (
    <div className="document-editor" aria-busy={!ready}>
      <div ref={root} />
      {!ready && (
        <p className="meta" role="status">
          Loading editor…
        </p>
      )}
    </div>
  );
}

function initializedInstance(instance: Crepe) {
  return instance.editor.status === "Created";
}
