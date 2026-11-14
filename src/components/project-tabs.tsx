import Link from "next/link";
export function ProjectTabs({
  projectId,
  active,
}: {
  projectId: string;
  active: string;
}) {
  const base = `/workspace/projects/${projectId}`;
  return (
    <nav className="content-tabs" aria-label="Project content">
      {[
        ["Overview", base],
        ["Pages", `${base}/pages`],
        ["Files", `${base}/files`],
        ["Notes", `${base}?view=notes`],
      ].map(([label, href]) => (
        <Link
          key={label}
          href={href}
          aria-current={active === label ? "page" : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
