import { randomUUID } from "node:crypto";
import Link from "next/link";
import type { Principal, WorkspacePage } from "@/lib/store";
import { getStore } from "@/lib/db";
import { ActionForm } from "./forms";
import { AgentMark } from "./brand";
import { MarkdownContent } from "./markdown";

export async function PageDiscussion({
  page,
  actor,
  offset = 0,
}: {
  page: WorkspacePage;
  actor: Principal;
  offset?: number;
}) {
  const result = await getStore().listComments(actor, page.id, offset);
  return (
    <section className="page-discussion">
      <h2>Discussion</h2>
      <p className="meta">
        Shared context for the next visit. Comments don’t start an agent run.
      </p>
      {result.comments.map((comment) => (
        <article key={comment.id} className="page-comment">
          <header>
            <span className="contributor">
              <AgentMark name={comment.authorName} small />
              <strong>{comment.authorName}</strong>
            </span>
            <time>
              {new Date(comment.createdAt).toLocaleString("en-GB", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </time>
          </header>
          <MarkdownContent body={comment.body} />
          {(actor.kind === "owner" || actor.id === comment.authorId) && (
            <ActionForm
              operation="delete-comment"
              label="Delete comment"
              className="comment-delete"
            >
              <input type="hidden" name="commentId" value={comment.id} />
            </ActionForm>
          )}
        </article>
      ))}
      {!result.comments.length && (
        <p className="empty-list">
          Leave a question, source, or decision beside the work.
        </p>
      )}
      {result.nextOffset !== null && (
        <Link
          className="text-link"
          href={`?discussion=1&comments=${result.nextOffset}`}
        >
          More comments
        </Link>
      )}
      {offset > 0 && (
        <Link className="text-link" href="?discussion=1">
          Back to first comments
        </Link>
      )}
      <ActionForm
        operation="page-comment"
        label="Add comment"
        key={`comment-${result.comments.at(-1)?.id || "empty"}`}
      >
        <input type="hidden" name="pageId" value={page.id} />
        <input type="hidden" name="clientKey" value={randomUUID()} />
        <label className="field">
          <span>Your comment</span>
          <textarea
            name="body"
            rows={4}
            maxLength={10000}
            required
            placeholder="Leave context for the next contributor…"
          />
        </label>
      </ActionForm>
    </section>
  );
}
