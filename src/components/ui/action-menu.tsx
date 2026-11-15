"use client";

import { Fragment } from "react";
import Link from "next/link";
import { Menu } from "@base-ui/react/menu";

export function ActionMenu({
  label,
  items,
  trigger,
}: {
  label: string;
  trigger?: React.ReactNode;
  items: {
    label: string;
    href: string;
    danger?: boolean;
    separator?: boolean;
  }[];
}) {
  return (
    <Menu.Root>
      <Menu.Trigger
        className="icon-button entity-menu-trigger"
        aria-label={label}
      >
        {trigger || "⋯"}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          align="end"
          sideOffset={8}
          className="entity-menu-positioner"
        >
          <Menu.Popup className="entity-menu-items">
            {items.map((item) => (
              <Fragment key={item.href}>
                {item.separator && (
                  <Menu.Separator className="entity-menu-separator" />
                )}
                <Menu.Item
                  render={<Link href={item.href} scroll={false} />}
                  className={item.danger ? "danger-text" : undefined}
                >
                  {item.label}
                </Menu.Item>
              </Fragment>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
