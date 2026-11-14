import type { ReactNode } from "react";

export function ActionGroup({
  children,
  layout = "inline",
}: {
  children: ReactNode;
  layout?: "inline" | "stack";
}) {
  return (
    <div className="action-group" data-layout={layout}>
      {children}
    </div>
  );
}
