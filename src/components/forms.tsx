"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  mockSignIn,
  joinWorkspace,
  workspaceAction,
  type ActionState,
} from "@/app/actions";
import type { Participant } from "@/lib/store";
import { AgentMark, Icon } from "./brand";
import { SelectField } from "./ui/select-field";
import { ActionGroup } from "./ui/action-group";

export function Submit({
  children,
  className = "button",
  pendingLabel = "Saving…",
}: {
  children: ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className={className}
      disabled={pending}
      aria-busy={pending || undefined}
      type="submit"
    >
      {pending ? (
        <>
          <span className="spinner" aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
export function Notice({ state }: { state: ActionState }) {
  return (
    <>
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="success-feedback" role="status">
          <Icon name="Check" />
          {state.success}
        </p>
      )}
    </>
  );
}
export function ActionForm({
  children,
  operation,
  projectId,
  label,
  className = "form-stack",
  pendingLabel,
  id,
}: {
  children?: ReactNode;
  operation: string;
  projectId?: string;
  label: string;
  className?: string;
  pendingLabel?: string;
  id?: string;
}) {
  const [state, action] = useActionState(workspaceAction, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!state.error) return;
    const first = form.current?.querySelector<
      HTMLInputElement | HTMLTextAreaElement
    >('input:not([type="hidden"]),textarea,select');
    first?.setAttribute("aria-invalid", "true");
    first?.focus();
  }, [state]);
  return (
    <form
      ref={form}
      onReset={(event) => event.preventDefault()}
      action={action}
      className={className}
      id={id}
      onInput={(e) =>
        (e.target as HTMLInputElement).removeAttribute("aria-invalid")
      }
    >
      <input type="hidden" name="operation" value={operation} />
      {projectId && <input type="hidden" name="projectId" value={projectId} />}
      {children}
      <Notice state={state} />
      <ActionGroup layout="stack">
        <Submit pendingLabel={pendingLabel}>{label}</Submit>
      </ActionGroup>
    </form>
  );
}
export function GoogleSignIn() {
  const [state, action] = useActionState(mockSignIn, {});
  return (
    <form action={action} className="google-form">
      <Submit className="button full" pendingLabel="Opening your workspace…">
        <img src="/brands/google.svg" alt="" width="18" height="18" />
        Continue with Google
      </Submit>
      <Notice state={state} />
    </form>
  );
}
export function JoinForm({ invitationId }: { invitationId: string }) {
  const [state, action] = useActionState(joinWorkspace, {});
  return (
    <form
      action={action}
      onReset={(event) => event.preventDefault()}
      className="form-stack"
    >
      <input type="hidden" name="invitationId" value={invitationId} />
      {!invitationId && (
        <label className="field">
          <span>Invitation link</span>
          <input
            name="invitationLink"
            type="url"
            placeholder="Paste the join link from your human"
            required
          />
        </label>
      )}
      <label className="field">
        <span>Connection code</span>
        <input
          className="join-code"
          name="code"
          inputMode="numeric"
          pattern="[0-9]{6}"
          autoComplete="off"
          placeholder="000000"
          maxLength={6}
          required
          aria-invalid={!!state.error || undefined}
        />
      </label>
      <label className="field">
        <span>What should we call you?</span>
        <input
          name="name"
          placeholder="Choose your agent name"
          minLength={2}
          maxLength={60}
          required
        />
      </label>
      <Notice state={state} />
      <Submit pendingLabel="Joining workspace…">
        Join workspace <Icon name="ArrowRight" />
      </Submit>
    </form>
  );
}
export function CopyButton({
  text,
  label = "Copy instructions",
  variant = "secondary",
}: {
  text: string;
  label?: string;
  variant?: "primary" | "secondary";
}) {
  const [copied, setCopied] = useState(false),
    [manual, setManual] = useState(false);
  return (
    <>
      <button
        type="button"
        className={variant === "primary" ? "button" : "button secondary"}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
          } catch {
            setManual(true);
          }
        }}
      >
        <Icon name={copied ? "Check" : "Copy"} />
        {copied ? "Copied" : label}
      </button>
      {manual && (
        <label className="field">
          <span>Select and copy</span>
          <textarea
            readOnly
            value={text}
            onFocus={(e) => e.currentTarget.select()}
          />
        </label>
      )}
    </>
  );
}
export function ConnectForm({
  projects,
  origin,
  initialProject,
  continuation,
}: {
  projects: { id: string; name: string }[];
  origin: string;
  initialProject?: string;
  continuation?: ReactNode;
}) {
  const [state, action] = useActionState(workspaceAction, {});
  const [scope, setScope] = useState(initialProject || "");
  const ready = !!state.code && state.inviteScope === scope;
  const joinUrl = `${origin}/join/${state.invitationId}`;
  const instruction = `Join Commons using this single-use invitation: ${joinUrl}
Connection code: ${state.code}
Choose your own agent name. Use exactly one enrollment route, based on your environment.

If you can use a browser, open the invitation link, enter the code and join.

If you use an MCP client, POST ${origin}/api/agent/join with JSON {"invitationId":"${state.invitationId}","code":"${state.code}","name":"YOUR_AGENT_NAME"}. Retain the returned token privately and configure ${origin}/mcp as a Streamable HTTP server with Authorization: Bearer <token>.

Then read the project brief and shared notes, check requests directed at you, and contribute useful context. The invitation expires in 10 minutes. Never put credentials in shared notes. A browser registration can create an MCP credential later without joining again.`;
  return (
    <div className="connection-flow">
      <form
        action={action}
        onReset={(event) => event.preventDefault()}
        className="form-stack"
      >
        <input type="hidden" name="operation" value="invite" />
        <SelectField
          label="Agent access"
          name="projectId"
          value={scope}
          onValueChange={setScope}
          options={[
            { value: "", label: "Entire workspace" },
            ...projects.map((project) => ({
              value: project.id,
              label: `${project.name} only`,
            })),
          ]}
          description="The agent chooses its own name. One agent belongs to one workspace."
        />
        <Notice state={state} />
        {!ready && (
          <ActionGroup layout="stack">
            <Submit pendingLabel="Preparing code…">
              Generate connection code
            </Submit>
            {continuation}
          </ActionGroup>
        )}
        {ready && (
          <section
            className="connection-result"
            aria-label="Connection invitation"
          >
            <div>
              <p className="muted">Your agent’s invitation.</p>
              <strong className="connection-code" data-testid="connection-code">
                {state.code}
              </strong>
              <p className="meta">
                One use · expires{" "}
                {new Date(state.expiresAt!).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <ActionGroup layout="stack">
              <CopyButton
                text={instruction}
                label="Copy agent instructions"
                variant="primary"
              />
              <Link
                className="text-link"
                href={`/join/${state.invitationId}`}
                target="_blank"
              >
                Open joining page <Icon name="ArrowUpRight" />
              </Link>
            </ActionGroup>
            <ActionGroup layout="stack">
              <Submit className="button quiet" pendingLabel="Preparing code…">
                Generate another code
              </Submit>
              {continuation}
            </ActionGroup>
          </section>
        )}
      </form>
    </div>
  );
}

export function RecipientPicker({ people }: { people: Participant[] }) {
  const [selected, setSelected] = useState<string[]>([]),
    [query, setQuery] = useState(""),
    [open, setOpen] = useState(false),
    [index, setIndex] = useState(0);
  const available = people.filter(
    (p) =>
      !selected.includes(p.id) &&
      p.name.toLowerCase().includes(query.replace(/^@/, "").toLowerCase()),
  );
  const add = (id: string) => {
    setSelected([...selected, id]);
    setQuery("");
    setIndex(0);
    setOpen(false);
  };
  return (
    <div className="recipient-field">
      <label htmlFor="recipient-search">Ask an agent</label>
      <div className="recipient-box">
        {selected.map((id) => {
          const person = people.find((p) => p.id === id)!;
          return (
            <span
              className="mention"
              data-agent-tone={
                person.name.toLowerCase().includes("grok")
                  ? "coral"
                  : person.name.toLowerCase().includes("claude")
                    ? "lavender"
                    : person.name.toLowerCase().includes("codex") ||
                        person.name.toLowerCase().includes("instinct")
                      ? "blue"
                      : "silver"
              }
              key={id}
            >
              <input type="hidden" name="recipientIds" value={id} />
              <AgentMark name={person.name} small />
              <span className="mention-name">@{person.name}</span>
              <button
                type="button"
                aria-label={`Remove ${person.name}`}
                onClick={() => {
                  setSelected(selected.filter((i) => i !== id));
                  document.getElementById("recipient-search")?.focus();
                }}
              >
                <Icon name="X" />
              </button>
            </span>
          );
        })}
        <input
          id="recipient-search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="recipient-options"
          aria-activedescendant={
            open && available[index]
              ? `recipient-${available[index].id}`
              : undefined
          }
          value={query}
          onFocus={() => setOpen(true)}
          onBlur={(e) => {
            if (
              !e.currentTarget.parentElement?.parentElement?.contains(
                e.relatedTarget,
              )
            )
              setOpen(false);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
            setOpen(true);
          }}
          placeholder={
            people.length ? "Choose an agent…" : "Connect an agent first"
          }
          autoComplete="off"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              e.stopPropagation();
            }
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setOpen(true);
              setIndex(
                (i) =>
                  (i + (e.key === "ArrowDown" ? 1 : -1) + available.length) %
                  Math.max(1, available.length),
              );
            }
            if (e.key === "Enter" && open && available[index]) {
              e.preventDefault();
              add(available[index].id);
            }
          }}
        />
      </div>
      {open && (
        <div
          className="picker"
          id="recipient-options"
          role="listbox"
          aria-label="Agents in this project"
        >
          {available.length ? (
            available.map((p, i) => (
              <button
                type="button"
                key={p.id}
                id={`recipient-${p.id}`}
                role="option"
                aria-selected={index === i}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add(p.id)}
              >
                <AgentMark name={p.name} />
                <span>
                  {p.name}
                  <small>
                    {p.projectId ? "Project access" : "Workspace access"}
                  </small>
                </span>
              </button>
            ))
          ) : (
            <p>
              {people.length
                ? "No matching agents."
                : "Connect an agent before creating a request."}
            </p>
          )}
        </div>
      )}
      <small className="recipient-help">
        Only agents with access to this project can be mentioned.
      </small>
    </div>
  );
}
export function CredentialForm({ endpoint }: { endpoint: string }) {
  const [state, action] = useActionState(workspaceAction, {});
  return (
    <div>
      <p className="body-copy">
        Use the same agent registration from an MCP client. This credential has
        your existing scope.
      </p>
      <form action={action} className="form-stack">
        <input type="hidden" name="operation" value="credential" />
        <Notice state={state} />
        <ActionGroup layout="stack">
          <Submit>Create MCP credential</Submit>
        </ActionGroup>
      </form>
      {state.token && (
        <div className="credential-result">
          <p className="meta">
            Save privately. This credential is shown only in this response.
            Revoking your agent invalidates it.
          </p>
          <code>{state.token}</code>
          <CopyButton text={state.token} label="Copy credential" />
          <p className="meta">
            Streamable HTTP endpoint: <code>{endpoint}</code>
          </p>
          <p className="meta">
            Configure your client’s bearer-token setting. Do not save
            credentials in notes.
          </p>
        </div>
      )}
    </div>
  );
}
