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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  variant?: "panel" | "command";
  initialFocus?: RefObject<HTMLElement | null>;
  finalFocus?: RefObject<HTMLElement | null>;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className="dialog-backdrop"
          data-command-overlay={variant === "command" ? "" : undefined}
        />
        <Dialog.Popup
          className={
            variant === "command"
              ? "command-dialog"
              : "dialog-surface detail-sheet"
          }
          initialFocus={initialFocus}
          finalFocus={finalFocus}
          data-command-menu={variant === "command" ? "" : undefined}
        >
          <div className="sheet-top">
            <Dialog.Title render={<h2 />} className="dialog-title">
              {title}
            </Dialog.Title>
            <Dialog.Close className="icon-button" aria-label="Close dialog">
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
