import Link from "next/link";
import { requireParticipant } from "@/lib/session";
import { getStore } from "@/lib/db";
import { ProjectTabs } from "@/components/project-tabs";
import { FileUpload } from "@/components/file-upload";
import { Icon } from "@/components/brand";
import { DetailSheet } from "@/components/detail-sheet";
import { ActionForm, CopyButton } from "@/components/forms";
import { appUrl } from "@/lib/config";

export default async function Files({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{
    q?: string;
    file?: string;
    delete?: string;
    offset?: string;
  }>;
}) {
  const actor = await requireParticipant(),
    { projectId } = await params,
    query = await searchParams,
    store = getStore();
  const project = await store.getProject(actor, projectId),
    result = await store.listFiles(actor, projectId, {
      query: (query.q || "").slice(0, 200),
      offset: Math.max(0, Math.min(1000000, Number(query.offset) || 0)),
    });
  const base = `/workspace/projects/${projectId}/files`;
  const selected = query.file
    ? await store.getFile(actor, query.file).catch(() => null)
    : null;
  const file = selected?.projectId === projectId ? selected : null;
  const image = file && file.mimeType.startsWith("image/");
  const canDelete =
    file && (actor.kind === "owner" || actor.id === file.authorId);
  const bytes = (n: number) =>
    n < 1024
      ? `${n} B`
      : n < 1048576
        ? `${Math.round(n / 1024)} KB`
        : `${(n / 1048576).toFixed(1)} MB`;
  return (
    <>
      <div className="project-page">
        <header className="project-heading">
          <div>
            <h1>Project files</h1>
            <p>Source material for everyone working on {project.name}.</p>
          </div>
          <a className="button" href="#upload-files">
            <Icon name="Plus" />
            Upload files
          </a>
        </header>
        <ProjectTabs projectId={projectId} active="Files" />
        <section className="project-section" id="upload-files">
          <FileUpload projectId={projectId} />
        </section>
        <form className="project-search">
          <Icon name="MagnifyingGlass" />
          <input
            name="q"
            aria-label="Find a file"
            placeholder="Find a file…"
            maxLength={200}
            defaultValue={query.q}
          />
          <button className="text-link">Search</button>
        </form>
        <div className="file-table">
          <div className="file-table-heading">
            <span>Name</span>
            <span>Added by</span>
            <span>Added</span>
            <span>Size</span>
          </div>
          {result.files.map((f) => (
            <Link
              className="file-table-row"
              key={f.id}
              href={`${base}?file=${f.id}`}
            >
              <div className="file-name">
                <span className="file-extension">
                  {f.name.split(".").at(-1)?.slice(0, 5).toUpperCase()}
                </span>
                <strong>{f.name}</strong>
              </div>
              <span>{f.authorName}</span>
              <time>
                {new Date(f.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </time>
              <span>{bytes(f.size)}</span>
            </Link>
          ))}
          {!result.files.length && (
            <div className="empty-state">
              <Icon name="Folder" />
              <h2>
                {query.q
                  ? "No files match your search."
                  : "Bring the source material."}
              </h2>
              <p>
                Upload images, documents or any original file your agents need.
              </p>
            </div>
          )}
        </div>
        {result.nextOffset !== null && (
          <Link
            className="show-more"
            href={`${base}?q=${encodeURIComponent(query.q || "")}&offset=${result.nextOffset}`}
          >
            More files
          </Link>
        )}
      </div>
      {query.file && (
        <DetailSheet title={file?.name || "File unavailable"} closeHref={base}>
          {file ? (
            <>
              {query.delete && canDelete ? (
                <>
                  <p className="detail-intro">
                    Delete this file from the project? Pages linking to it will
                    keep their text, but the original file will no longer open.
                  </p>
                  <ActionForm
                    operation="delete-file"
                    label="Delete file"
                    danger
                  >
                    <input type="hidden" name="fileId" value={file.id} />
                  </ActionForm>
                  <Link className="text-link" href={`${base}?file=${file.id}`}>
                    Keep file
                  </Link>
                </>
              ) : (
                <>
                  <p className="detail-intro">
                    Added by {file.authorName} · {bytes(file.size)}
                  </p>
                  {image && (
                    <img
                      className="file-image-preview"
                      src={`/api/files/${file.id}?preview=1`}
                      alt={file.name}
                    />
                  )}
                  <div className="file-detail-actions">
                    <a
                      className="button"
                      href={`/api/files/${file.id}`}
                      download={file.name}
                    >
                      Download original
                    </a>
                    <CopyButton
                      text={`${appUrl().origin}/api/files/${file.id}`}
                      label="Copy file link"
                    />
                    <CopyButton
                      text={`${image ? "!" : ""}[${file.name.replace(/[\[\]]/g, "")} ](/api/files/${file.id}${image ? "?preview=1" : ""})`}
                      label="Copy Markdown"
                    />
                  </div>
                  <p className="meta">
                    Only participants with project access can open this file.
                  </p>
                  {canDelete && (
                    <Link
                      className="text-link danger-text"
                      href={`${base}?file=${file.id}&delete=1`}
                    >
                      Delete file
                    </Link>
                  )}
                </>
              )}
            </>
          ) : (
            <p className="detail-intro">
              It may have been deleted, or you no longer have access.
            </p>
          )}
        </DetailSheet>
      )}
    </>
  );
}
