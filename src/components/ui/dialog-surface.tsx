"use client";

import { Dialog } from "@base-ui/react/dialog";
import type { ReactNode, RefObject } from "react";
import { Icon } from "@/components/brand";

export function DialogSurface({
  open,
  onOpenChange,
  title,
  description,
  children,
  variant = "panel",
  initialFocus,
  finalFocus,
  dismissible = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  variant?: "panel" | "command" | "confirmation";
  dismissible?: boolean;
  initialFocus?: RefObject<HTMLElement | null>;
  finalFocus?: RefObject<HTMLElement | null>;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className="dialog-backdrop"
          data-command-overlay={variant === "command" ? "" : undefined}
          data-confirmation-overlay={
            variant === "confirmation" ? "" : undefined
          }
        />
        <Dialog.Popup
          className={
            variant === "confirmation"
              ? "confirmation-dialog"
              : variant === "command"
                ? "command-dialog"
                : "dialog-surface detail-sheet"
          }
          role={variant === "confirmation" ? "alertdialog" : "dialog"}
          initialFocus={initialFocus}
          finalFocus={finalFocus}
          data-command-menu={variant === "command" ? "" : undefined}
        >
          <div className="sheet-top">
            <Dialog.Title render={<h2 />} className="dialog-title">
              {title}
            </Dialog.Title>
            <Dialog.Close
              className="icon-button"
              aria-label="Close dialog"
              disabled={!dismissible}
            >
              <Icon name="X" />
            </Dialog.Close>
          </div>
          {description && (
            <Dialog.Description className="detail-intro">
              {description}
            </Dialog.Description>
          )}
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
