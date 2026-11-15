import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownContent({ body }: { body: string }) {
  return (
    <div className="markdown-content">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) =>
            typeof src === "string" &&
            /^\/api\/files\/[a-f0-9-]{36}(\?preview=1)?$/.test(src) ? (
              <img src={src} alt={alt || "Project image"} loading="lazy" />
            ) : (
              <span className="external-image">
                External image:{" "}
                <a
                  href={
                    typeof src === "string" && /^https?:\/\//.test(src)
                      ? src
                      : undefined
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {alt || "Open original image"}
                </a>
              </span>
            ),
          table: ({ children }) => (
            <div className="markdown-table">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {body}
      </Markdown>
    </div>
  );
}
