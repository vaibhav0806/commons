"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./brand";

export function DetailSheet({
  title,
  label,
  closeHref,
  children,
}: {
  title: string;
  label?: string;
  closeHref: string;
  children: React.ReactNode;
}) {
  const sheet = useRef<HTMLElement>(null),
    router = useRouter();
  useEffect(() => {
    const background = [
      ...document.querySelectorAll<HTMLElement>("[data-workspace-background]"),
    ];
    const origin =
      document.activeElement instanceof HTMLAnchorElement
        ? document.activeElement.getAttribute("href")
        : null;
    background.forEach((e) => {
      e.inert = true;
    });
    sheet.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (
        document.querySelector(
          "[data-select-popup]:not([data-ending-style]), [data-command-menu]:not([data-ending-style])",
        )
      )
        return;
      if (event.key === "Escape" && !event.defaultPrevented) {
        event.preventDefault();
        router.push(closeHref, { scroll: false });
      }
      if (event.key !== "Tab") return;
      const controls = [
        ...(sheet.current?.querySelectorAll<HTMLElement>(
          'a[href],button:not(:disabled),input:not([type="hidden"]),textarea,select',
        ) || []),
      ].filter((e) => !e.closest("[hidden]") && e.getClientRects().length);
      const first = controls[0],
        last = controls.at(-1);
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === sheet.current)
      ) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const move = (event: PointerEvent) => {
      if (
        event.pointerType === "mouse" &&
        !matchMedia("(prefers-reduced-motion: reduce)").matches &&
        sheet.current
      )
        sheet.current.style.setProperty(
          "--pointer-x",
          `${event.clientX - sheet.current.getBoundingClientRect().left}px`,
        );
    };
    sheet.current?.addEventListener("pointermove", move);
    const node = sheet.current;
    return () => {
      document.removeEventListener("keydown", onKey);
      node?.removeEventListener("pointermove", move);
      background.forEach((e) => {
        e.inert = false;
      });
      requestAnimationFrame(() => {
        if (document.querySelector('[role="dialog"]')) return;
        const link = origin
          ? [...document.querySelectorAll<HTMLAnchorElement>("a[href]")].find(
              (a) => a.getAttribute("href") === origin,
            )
          : null;
        (
          link || document.querySelector<HTMLElement>(".project-heading h1")
        )?.focus({ preventScroll: true });
      });
    };
  }, [closeHref, router]);
  return (
    <>
      <div
        className="sheet-backdrop"
        onClick={() => router.push(closeHref, { scroll: false })}
      />
      <section
        ref={sheet}
        className="detail-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
        tabIndex={-1}
      >
        <div className="sheet-top">
          <div className="sheet-heading">
            <h2 id="detail-title">{title}</h2>
            {label && <p className="detail-kind">{label}</p>}
          </div>
          <button
            className="icon-button"
            aria-label="Close details"
            onClick={() => router.push(closeHref, { scroll: false })}
          >
            <Icon name="X" />
          </button>
        </div>
        {children}
      </section>
    </>
  );
}
