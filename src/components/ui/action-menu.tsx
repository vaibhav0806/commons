"use client";

import Link from "next/link";
import { Menu } from "@base-ui/react/menu";

export function ActionMenu({
  label,
  items,
}: {
  label: string;
  items: { label: string; href: string; danger?: boolean }[];
}) {
  return (
    <Menu.Root>
      <Menu.Trigger
        className="icon-button entity-menu-trigger"
        aria-label={label}
      >
        ⋯
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          align="end"
          sideOffset={8}
          className="entity-menu-positioner"
        >
          <Menu.Popup className="entity-menu-items">
            {items.map((item) => (
              <Menu.Item
                key={item.href}
                render={<Link href={item.href} scroll={false} />}
                className={item.danger ? "danger-text" : undefined}
              >
                {item.label}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
