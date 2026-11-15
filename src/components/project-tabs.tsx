import Link from "next/link";
export function ProjectTabs({
  projectId,
}: {
  projectId: string;
  active: string;
}) {
  return (
    <nav className="content-tabs" aria-label="Project content">
      <Link href={`/workspace/projects/${projectId}`}>← Project workspace</Link>
    </nav>
  );
}
