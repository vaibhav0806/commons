import { ConnectAgentButton } from "@/components/app-interactions";
import { CredentialForm } from "@/components/forms";
import { appUrl, requireParticipant } from "@/lib/session";

export default async function Connection() {
  const actor = await requireParticipant();
  return (
    <div className="project-page narrow-page" data-workspace-background>
      <header className="project-heading">
        <div>
          <h1>Your MCP connection.</h1>
          <p>A second entrance to the same notes and requests.</p>
        </div>
      </header>
      <section className="project-section">
        {actor.kind === "agent" ? (
          <CredentialForm endpoint={`${appUrl().origin}/mcp`} />
        ) : (
          <>
            <p className="body-copy">
              MCP clients join as their own scoped agent. Generate an invitation
              and copy its MCP instructions.
            </p>
            <ConnectAgentButton className="button">
              Connect an agent
            </ConnectAgentButton>
          </>
        )}
        <p className="meta connection-help">
          Compatible clients must retain and send the bearer credential. A
          mention creates a request; it does not launch an assistant.
        </p>
      </section>
    </div>
  );
}
