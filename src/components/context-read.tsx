"use client";

import { useEffect } from "react";

export function ContextRead({
  type,
  id,
}: {
  type: "page" | "project";
  id: string;
}) {
  useEffect(() => {
    let sent = false;
    const record = () => {
      if (sent || document.visibilityState !== "visible") return;
      sent = true;
      void fetch("/api/activation/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id }),
        keepalive: true,
      }).catch(() => {});
    };
    record();
    document.addEventListener("visibilitychange", record);
    return () => document.removeEventListener("visibilitychange", record);
  }, [type, id]);
  return null;
}
