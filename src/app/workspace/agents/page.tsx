import Link from "next/link";
import { cookies } from "next/headers";
import { ConnectAgentButton } from "@/components/app-interactions";
import { AgentIdentityField } from "@/components/agent-identity-field";
import { ActionForm } from "@/components/forms";
import { AgentMark, Icon } from "@/components/brand";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { DetailSheet } from "@/components/detail-sheet";
import { SelectField } from "@/components/ui/select-field";
import { getStore } from "@/lib/db";
import { requireParticipant, sessionCookie } from "@/lib/session";

export default async function Agents({
  searchParams,
}: {
  searchParams: Promise<{ agent?: string; action?: string; session?: string }>;
}) {
  const actor = await requireParticipant(),
    store = getStore(),
    query = await searchParams;
  const owner = actor.kind === "owner";
  const [people, projects] = await Promise.all([
    store.listParticipants(actor, undefined, owner),
    store.listProjects(actor),
  ]);
  const agents = people.filter((p) => p.kind === "agent");
  const selected = owner ? agents.find((p) => p.id === query.agent) : undefined;
  const sessions = selected
    ? await store.listSessions(
        actor,
        (await cookies()).get(sessionCookie)?.value || "",
        selected.id,
      )
    : [];
  const selectedSession = sessions.find((s) => s.id === query.session);
  return (
    <>
      <div className="project-page" data-workspace-background>
        <header className="project-heading">
          <div>
            <h1>Agents</h1>
          </div>
          {owner ? (
            <ConnectAgentButton className="button">
              <Icon name="Plus" />
              Bring an agent
            </ConnectAgentButton>
          ) : (
            <Link className="button secondary" href="/workspace/connection">
              MCP connection
            </Link>
          )}
        </header>
        <section className="project-section">
          {!agents.length ? (
            <div className="empty-state">
              <Icon name="UsersThree" />
              <h2>No agents yet.</h2>
              <p>
                Share an invitation. Your agent will join and choose its name.
              </p>
              {owner && (
                <ConnectAgentButton className="text-link">
                  Connect your first agent <Icon name="ArrowRight" />
                </ConnectAgentButton>
              )}
            </div>
          ) : (
            <ul className="agent-list">
              {agents.map((p) => (
                <li key={p.id} data-agent-id={p.id} id={`agent-${p.id}`}>
                  <AgentMark identity={p.agentIdentity} />
                  <div className="agent-summary">
                    <h2>{p.name}</h2>
                    <p>
                      {p.projectId
                        ? `${projects.find((project) => project.id === p.projectId)?.name || "Assigned project"} only`
                        : "All workspace projects"}
                    </p>
                    <small>
                      {p.revokedAt
                        ? "Access revoked"
                        : `Last checked ${new Date(p.lastSeen).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}`}
                    </small>
                  </div>
                  {owner && (
                    <Link
                      className="text-link"
                      href={`/workspace/agents?agent=${p.id}`}
                      scroll={false}
                    >
                      Manage agent
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      {selected &&
      (query.action === "remove" ||
        query.action === "revoke" ||
        selectedSession) ? (
        <ConfirmationDialog
          title={
            query.action === "remove"
              ? "Remove agent?"
              : query.action === "revoke"
                ? "Revoke access?"
                : "Revoke credential?"
          }
          description={
            selectedSession
              ? `End the ${selectedSession.label} connection for ${selected.name}? Other credentials remain active.`
              : `${selected.name} will lose browser and MCP access immediately. ${query.action === "remove" ? "Their registration will also disappear from this list." : "Their registration stays visible as revoked."} Shared notes keep their original authorship.`
          }
          operation={
            query.action === "remove"
              ? "remove-agent"
              : query.action === "revoke"
                ? "revoke"
                : "revoke-session"
          }
          label={
            query.action === "remove"
              ? "Remove agent"
              : query.action === "revoke"
                ? "Revoke access"
                : "Revoke credential"
          }
          closeHref={`/workspace/agents?agent=${selected.id}`}
        >
          <input type="hidden" name="participantId" value={selected.id} />
          {selectedSession && (
            <input type="hidden" name="sessionId" value={selectedSession.id} />
          )}
        </ConfirmationDialog>
      ) : (
        selected && (
          <DetailSheet title={selected.name} closeHref="/workspace/agents">
            <p className="detail-intro">
              Joined {new Date(selected.createdAt).toLocaleDateString()} ·{" "}
              {selected.revokedAt ? "Access revoked" : "Active registration"}
            </p>
            {!selected.revokedAt && (
              <ActionForm operation="edit-agent" label="Save agent">
                <input type="hidden" name="participantId" value={selected.id} />
                <label className="field">
                  <span>Agent name</span>
                  <input
                    name="name"
                    defaultValue={selected.name}
                    minLength={2}
                    maxLength={60}
                    required
                  />
                </label>
                <AgentIdentityField value={selected.agentIdentity} />
                <SelectField
                  label="Agent access"
                  name="projectId"
                  defaultValue={selected.projectId || ""}
                  options={[
                    { value: "", label: "Entire workspace" },
                    ...projects.map((p) => ({
                      value: p.id,
                      label: p.name,
                    })),
                  ]}
                  description="Access changes apply immediately to existing browser and MCP connections."
                />
              </ActionForm>
            )}
            <section className="settings-section">
              <h2>Connections</h2>
              {sessions.length ? (
                <ul className="settings-list">
                  {sessions.map((session) => (
                    <li key={session.id}>
                      <div>
                        <strong>{session.label}</strong>
                        <p className="meta">
                          Expires{" "}
                          {new Date(session.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Link
                        className="text-link"
                        href={`/workspace/agents?agent=${selected.id}&session=${session.id}`}
                        scroll={false}
                      >
                        Revoke
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="meta">No active connections.</p>
              )}
            </section>
            <div className="entity-actions">
              {!selected.revokedAt && (
                <Link
                  className="text-link danger-text"
                  href={`/workspace/agents?agent=${selected.id}&action=revoke`}
                  scroll={false}
                >
                  Revoke access
                </Link>
              )}
              <Link
                className="text-link danger-text"
                href={`/workspace/agents?agent=${selected.id}&action=remove`}
                scroll={false}
              >
                Remove agent
              </Link>
            </div>
          </DetailSheet>
        )
      )}
    </>
  );
}
