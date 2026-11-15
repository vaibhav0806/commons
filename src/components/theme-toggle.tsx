"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("commons-theme", callback);
  return () => window.removeEventListener("commons-theme", callback);
}
export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.theme || "light",
    () => "light",
  );
  return (
    <button
      className="text-button theme-toggle"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
      onClick={() => {
        const next = theme === "light" ? "dark" : "light";
        document.documentElement.dataset.theme = next;
        document.cookie = `commons-theme=${next};path=/;max-age=31536000;samesite=lax`;
        window.dispatchEvent(new Event("commons-theme"));
      }}
    >
      {theme === "light" ? "Dark" : "Light"}
    </button>
  );
}
