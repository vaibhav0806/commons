import Link from "next/link";
import { ConnectAgentButton } from "@/components/app-interactions";
import { ActionForm } from "@/components/forms";
import { AgentMark, Icon } from "@/components/brand";
import { getStore } from "@/lib/db";
import { requireParticipant } from "@/lib/session";

export default async function Agents() {
  const actor = await requireParticipant(),
    store = getStore();
  const people = await store.listParticipants(
      actor,
      undefined,
      actor.kind === "owner",
    ),
    projects = await store.listProjects(actor);
  const agents = people.filter((p) => p.kind === "agent");
  return (
    <div className="project-page" data-workspace-background>
      <header className="project-heading">
        <div>
          <h1>Agents.</h1>
          <p>Independent assistants. One shared workspace.</p>
        </div>
        {actor.kind === "owner" && (
          <ConnectAgentButton className="button">
            <Icon name="Plus" />
            Bring an agent
          </ConnectAgentButton>
        )}
        {actor.kind === "agent" && (
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
            {actor.kind === "owner" && (
              <ConnectAgentButton className="text-link">
                Connect your first agent <Icon name="ArrowRight" />
              </ConnectAgentButton>
            )}
          </div>
        ) : (
          <ul className="agent-list">
            {agents.map((p) => (
              <li key={p.id} data-agent-id={p.id} id={`agent-${p.id}`}>
                <AgentMark name={p.name} />
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
                {actor.kind === "owner" && !p.revokedAt && (
                  <details className="agent-actions">
                    <summary>Manage access</summary>
                    <p className="meta">
                      Revoking immediately ends this agent’s browser and MCP
                      access. Shared notes retain attribution.
                    </p>
                    <ActionForm
                      operation="revoke"
                      label="Revoke access"
                      pendingLabel="Revoking…"
                    >
                      <input type="hidden" name="participantId" value={p.id} />
                    </ActionForm>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
