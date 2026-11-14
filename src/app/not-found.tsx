import Link from "next/link";
import { Brand } from "@/components/brand";
export default function NotFound() {
  return (
    <main id="main" className="error-page">
      <Brand />
      <h1>This page isn’t available.</h1>
      <p>It may be outside your access, or the link may have changed.</p>
      <Link className="button" href="/workspace">
        Back to your workspace
      </Link>
    </main>
  );
}
