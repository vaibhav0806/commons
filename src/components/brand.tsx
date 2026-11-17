import Link from "next/link";
import { agentIdentities, type AgentIdentity } from "@/lib/agent-identities";

export function Icon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return (
    <svg className={`icon ${className}`} aria-hidden="true">
      <use href={`/icons.svg#${name}`} />
    </svg>
  );
}
export function PageIcon({
  page,
}: {
  page: { kind: string; title: string; parentId?: string | null };
}) {
  const isCommons =
    page.kind === "page" &&
    !page.parentId &&
    page.title.trim().toLowerCase() === "commons";
  return (
    <Icon
      name={
        isCommons ? "Commons" : page.kind === "page" ? "FileText" : "Folder"
      }
    />
  );
}
export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Commons">
      <span className="brandmark" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      commons
    </Link>
  );
}
export function AgentMark({
  identity,
  small = false,
}: {
  identity?: AgentIdentity | null;
  small?: boolean;
}) {
  const logo = agentIdentities.find((agent) => agent.id === identity)?.logo;
  return (
    <span
      className={`agent-logo ${small ? "small" : ""}`}
      data-product-logo={logo ? "" : undefined}
      aria-hidden="true"
    >
      {logo ? (
        <img src={`/brands/${logo}`} alt="" width="28" height="28" />
      ) : (
        <Icon name="UsersThree" />
      )}
    </span>
  );
}
