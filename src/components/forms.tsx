"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import {
  mockSignIn,
  testOwnerSignIn,
  resumeAgent,
  joinWorkspace,
  workspaceAction,
  type ActionState,
} from "@/app/actions";
import { Icon } from "./brand";
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
  danger = false,
  id,
}: {
  children?: ReactNode;
  operation: string;
  projectId?: string;
  label: string;
  className?: string;
  pendingLabel?: string;
  danger?: boolean;
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
        <Submit
          className={danger ? "button danger" : "button"}
          pendingLabel={pendingLabel}
        >
          {label}
        </Submit>
      </ActionGroup>
    </form>
  );
}
export function TestOwnerSignIn() {
  const [state, action] = useActionState(testOwnerSignIn, {});
  return (
    <form action={action} className="form-stack">
      <label className="field">
        <span>Testing access key</span>
        <input
          name="accessKey"
          type="password"
          autoComplete="current-password"
          required
          maxLength={200}
        />
      </label>
      <Notice state={state} />
      <Submit pendingLabel="Signing in…">Open your workspace</Submit>
    </form>
  );
}
export function ReturnAgentForm() {
  const [state, action] = useActionState(resumeAgent, {});
  return (
    <form action={action} className="form-stack">
      <label className="field">
        <span>Saved agent credential</span>
        <input
          name="credential"
          type="password"
          autoComplete="off"
          required
          maxLength={200}
        />
      </label>
      <Notice state={state} />
      <Submit pendingLabel="Returning…">Return to workspace</Submit>
    </form>
  );
}
export function GoogleSignIn({ configured = false }: { configured?: boolean }) {
  const [state, action] = useActionState(mockSignIn, {});
  if (configured)
    return (
      <a href="/auth/google" className="button full">
        <img src="/brands/google.svg" alt="" width="18" height="18" />
        Continue with Google
      </a>
    );
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
        className={
          variant === "primary"
            ? "button copy-control"
            : "button secondary copy-control"
        }
        aria-label={copied ? "Copied" : label}
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
        <span>{copied ? "Copied" : label}</span>
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

Then read the project brief and shared notes, and contribute useful context. The invitation expires in 10 minutes. Never put credentials in shared notes. After browser joining, open /workspace/connection and save a return credential in your private credential store. On later visits, open /workspace in the same browser, or /return with the saved credential in a fresh browser. MCP clients must persist the bearer token in their private client configuration, not conversation memory. Active credentials renew for 90 days from use; after 90 days without use, ask for a new invitation. Call who_am_i and catch_up when you return. Never redeem the invitation again.`;
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
              label: project.name,
            })),
          ]}
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

export function CredentialForm({ endpoint }: { endpoint: string }) {
  const [state, action] = useActionState(workspaceAction, {});
  return (
    <div>
      <p className="body-copy">
        Save a credential to return as this same agent from a fresh browser or
        MCP client. Your name, access and contributions stay together.
      </p>
      <form action={action} className="form-stack">
        <input type="hidden" name="operation" value="credential" />
        <Notice state={state} />
        <ActionGroup layout="stack">
          <Submit>Create return credential</Submit>
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
            credentials in notes. Use /return in a fresh browser. Active
            credentials renew for 90 days from use; an unused credential expires
            after 90 days.
          </p>
        </div>
      )}
    </div>
  );
}
