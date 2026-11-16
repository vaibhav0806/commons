"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { workspaceAction, type ActionState } from "@/app/actions";
import { Notice, Submit } from "./forms";
import { DialogSurface } from "./ui/dialog-surface";

export function ConfirmationDialog({
  title,
  description,
  operation,
  label,
  projectId,
  closeHref,
  triggerLabel,
  children,
}: {
  title: string;
  description: string;
  operation: string;
  label: string;
  projectId?: string;
  closeHref?: string;
  triggerLabel?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(!triggerLabel);
  const router = useRouter();
  const cancel = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const origin = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!triggerLabel && document.activeElement instanceof HTMLElement)
      origin.current = document.activeElement;
  }, [triggerLabel]);
  const [state, action, pending] = useActionState<ActionState, FormData>(
    async (previous, data) => {
      const result = await workspaceAction(previous, data);
      if (result.success) {
        if (closeHref) router.replace(closeHref, { scroll: false });
        else setOpen(false);
      }
      return result;
    },
    {},
  );
  const close = () => {
    if (pending) return;
    if (closeHref) router.replace(closeHref, { scroll: false });
    else setOpen(false);
  };
  return (
    <>
      {triggerLabel && (
        <button
          ref={trigger}
          type="button"
          className="text-link danger-text"
          onClick={() => setOpen(true)}
        >
          {triggerLabel}
        </button>
      )}
      <DialogSurface
        open={open}
        onOpenChange={(next) => {
          if (!next) close();
        }}
        title={title}
        description={description}
        variant="confirmation"
        initialFocus={cancel}
        finalFocus={triggerLabel ? trigger : origin}
        dismissible={!pending}
      >
        <form action={action} className="confirmation-form">
          <input type="hidden" name="operation" value={operation} />
          {projectId && (
            <input type="hidden" name="projectId" value={projectId} />
          )}
          <fieldset disabled={pending}>{children}</fieldset>
          <Notice state={state} />
          <div className="confirmation-actions">
            <button
              ref={cancel}
              type="button"
              className="button secondary"
              disabled={pending}
              onClick={close}
            >
              Cancel
            </button>
            <Submit className="button danger" pendingLabel="Working…">
              {label}
            </Submit>
          </div>
        </form>
      </DialogSurface>
    </>
  );
}
