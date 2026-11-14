import Link from "next/link";

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
  name,
  small = false,
}: {
  name: string;
  small?: boolean;
}) {
  const text = name.toLowerCase();
  const logo =
    text.includes("codex") || text.includes("chatgpt")
      ? "codex.svg"
      : text.includes("grok")
        ? "grokbot.svg"
        : text.includes("instinct")
          ? "instinct.png"
          : text.includes("claude")
            ? "claude.svg"
            : null;
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
