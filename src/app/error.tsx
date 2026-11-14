"use client";
import Link from "next/link";
import { ActionGroup } from "@/components/ui/action-group";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="error-page">
      <h1>We couldn’t load this.</h1>
      <p>
        Your saved work is still in Commons. Try again, or return to your
        workspace.
      </p>
      <ActionGroup>
        <button className="button" onClick={reset}>
          Try again
        </button>
        <Link className="text-link" href="/workspace">
          Open workspace
        </Link>
      </ActionGroup>
    </section>
  );
}
