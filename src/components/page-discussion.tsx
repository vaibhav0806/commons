import { randomUUID } from "node:crypto";
import Link from "next/link";
import type { Principal, WorkspacePage } from "@/lib/store";
import { getStore } from "@/lib/db";
import { ConfirmationDialog } from "./confirmation-dialog";
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
      {result.comments.map((comment) => (
        <article key={comment.id} className="page-comment">
          <header>
            <span className="contributor">
              <AgentMark identity={comment.authorAgentIdentity} small />
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
            <ConfirmationDialog
              title="Delete comment?"
              description="This permanently removes the comment from the discussion."
              operation="delete-comment"
              label="Delete comment"
              triggerLabel="Delete comment"
            >
              <input type="hidden" name="commentId" value={comment.id} />
            </ConfirmationDialog>
          )}
        </article>
      ))}
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
        className="form-stack comment-composer"
        key={`comment-${result.comments.at(-1)?.id || "empty"}`}
      >
        <input type="hidden" name="pageId" value={page.id} />
        <input type="hidden" name="clientKey" value={randomUUID()} />
        <label className="field">
          <span className="visually-hidden">Your comment</span>
          <textarea
            name="body"
            rows={3}
            maxLength={10000}
            required
            placeholder="Write a comment…"
          />
        </label>
      </ActionForm>
    </section>
  );
}
