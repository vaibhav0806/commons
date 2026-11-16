import Link from "next/link";
import { cookies } from "next/headers";
import { AgentIdentityField } from "@/components/agent-identity-field";
import { ActionForm } from "@/components/forms";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { ConnectAgentButton } from "@/components/app-interactions";
import { getStore } from "@/lib/db";
import { requireParticipant, sessionCookie } from "@/lib/session";

export default async function Settings({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; delete?: string; session?: string }>;
}) {
  const actor = await requireParticipant(),
    store = getStore(),
    query = await searchParams;
  const owner = actor.kind === "owner",
    tab =
      query.tab === "connections"
        ? "connections"
        : query.tab === "workspace" && owner
          ? "workspace"
          : "profile";
  const workspace = await store.getWorkspace(actor),
    token = (await cookies()).get(sessionCookie)?.value || "";
  const sessions = await store.listSessions(actor, token);
  const [counts, invitations, projects] = owner
    ? await Promise.all([
        store.workspaceCounts(actor),
        store.listInvitations(actor),
        store.listProjects(actor),
      ])
    : [null, [], []];
  const base = `/workspace/settings?tab=${tab}`;
  const selectedSession = sessions.find((s) => s.id === query.session);
  return (
    <>
      <div className="project-page settings-page" data-workspace-background>
        <header className="project-heading">
          <div>
            <h1>Settings</h1>
          </div>
        </header>
        <nav className="settings-tabs" aria-label="Settings sections">
          <Link
            href="/workspace/settings"
            aria-current={tab === "profile" ? "page" : undefined}
          >
            Profile
          </Link>
          {owner && (
            <Link
              href="/workspace/settings?tab=workspace"
              aria-current={tab === "workspace" ? "page" : undefined}
            >
              Workspace
            </Link>
          )}
          <Link
            href="/workspace/settings?tab=connections"
            aria-current={tab === "connections" ? "page" : undefined}
          >
            Connections
          </Link>
        </nav>
        {tab === "profile" && (
          <>
            <section className="settings-section">
              <h2>Profile</h2>
              <ActionForm operation="profile" label="Save profile">
                <label className="field">
                  <span>Display name</span>
                  <input
                    name="name"
                    defaultValue={actor.name}
                    minLength={2}
                    maxLength={60}
                    required
                  />
                </label>
                {!owner && <AgentIdentityField value={actor.agentIdentity} />}
              </ActionForm>
              <dl className="account-facts">
                {owner && (
                  <div>
                    <dt>Google email</dt>
                    <dd>{actor.email}</dd>
                  </div>
                )}
                <div>
                  <dt>Account type</dt>
                  <dd>{owner ? "Workspace owner" : "Agent"}</dd>
                </div>
                <div>
                  <dt>Joined</dt>
                  <dd>
                    {new Date(actor.createdAt).toLocaleDateString("en-GB", {
                      dateStyle: "medium",
                    })}
                  </dd>
                </div>
              </dl>
              {owner && (
                <p className="meta">
                  Your email is managed by Google. Editing your display name
                  here does not change your Google account.
                </p>
              )}
            </section>
            {owner && (
              <section className="settings-section danger-section">
                <h2>Delete account</h2>
                <p>
                  Remove your Commons account, workspace, projects, notes and
                  agent connections. This does not delete your Google account.
                </p>
                <Link
                  href={`${base}&delete=account`}
                  className="text-link danger-text"
                  scroll={false}
                >
                  Delete account
                </Link>
              </section>
            )}
          </>
        )}
        {tab === "workspace" && owner && (
          <>
            <section className="settings-section">
              <h2>Workspace</h2>
              <ActionForm operation="rename-workspace" label="Save workspace">
                <label className="field">
                  <span>Workspace name</span>
                  <input
                    name="name"
                    defaultValue={workspace.name}
                    minLength={2}
                    maxLength={60}
                    required
                  />
                </label>
              </ActionForm>
              <dl className="account-facts">
                <div>
                  <dt>Owner</dt>
                  <dd>{actor.name}</dd>
                </div>
                <div>
                  <dt>Projects</dt>
                  <dd>{counts?.projects}</dd>
                </div>
                <div>
                  <dt>Notes</dt>
                  <dd>{counts?.notes}</dd>
                </div>
                <div>
                  <dt>Agents</dt>
                  <dd>{counts?.agents}</dd>
                </div>
              </dl>
            </section>
            <section className="settings-section danger-section">
              <h2>Delete workspace</h2>
              <p>
                Permanently remove this workspace and its contents. Your account
                stays; you’ll start again with an empty workspace.
              </p>
              <Link
                href={`${base}&delete=workspace`}
                className="text-link danger-text"
                scroll={false}
              >
                Delete workspace
              </Link>
            </section>
          </>
        )}
        {tab === "connections" && (
          <>
            <section className="settings-section">
              <h2>Your sessions and credentials</h2>
              <p className="meta">
                Revoke a connection to end its access. Secret credentials are
                never displayed here.
              </p>
              <ul className="settings-list">
                {sessions.map((session) => (
                  <li key={session.id}>
                    <div>
                      <strong>
                        {session.label}
                        {session.current && " · This session"}
                      </strong>
                      <p className="meta">
                        Created{" "}
                        {new Date(session.createdAt).toLocaleDateString()} ·
                        Expires{" "}
                        {new Date(session.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Link
                      className="text-link"
                      href={`${base}&session=${session.id}`}
                      scroll={false}
                    >
                      Revoke
                    </Link>
                  </li>
                ))}
              </ul>
              {sessions.length > 1 && (
                <ConfirmationDialog
                  title="Sign out other sessions?"
                  description="Your other browser sessions will end. This session stays signed in."
                  operation="sign-out-others"
                  label="Sign out other sessions"
                  triggerLabel="Sign out other sessions"
                />
              )}
            </section>
            {owner && (
              <section className="settings-section">
                <div className="section-title">
                  <h2>Pending invitations</h2>
                  <ConnectAgentButton className="text-link">
                    New invitation
                  </ConnectAgentButton>
                </div>
                <p className="meta">
                  Single-use agent connection codes expire after ten minutes.
                  Cancel an invitation and create a new one to replace it.
                </p>
                {invitations.length ? (
                  <ul className="settings-list">
                    {invitations.map((invite) => (
                      <li key={invite.id}>
                        <div>
                          <strong>
                            {invite.projectId
                              ? projects.find((p) => p.id === invite.projectId)
                                  ?.name
                              : "Entire workspace"}
                          </strong>
                          <p className="meta">
                            Expires{" "}
                            {new Date(invite.expiresAt).toLocaleTimeString()} ·{" "}
                            {invite.id.slice(0, 8)}
                          </p>
                        </div>
                        <ConfirmationDialog
                          title="Cancel invitation?"
                          description="This invitation will stop working. You can generate a new one whenever you need it."
                          operation="cancel-invitation"
                          label="Cancel invitation"
                          triggerLabel="Cancel invitation"
                        >
                          <input
                            type="hidden"
                            name="invitationId"
                            value={invite.id}
                          />
                        </ConfirmationDialog>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-list">No pending invitations.</p>
                )}
                <Link className="text-link" href="/workspace/agents">
                  Manage agent access and credentials →
                </Link>
              </section>
            )}
          </>
        )}
      </div>
      {owner &&
        (query.delete === "workspace" || query.delete === "account") && (
          <ConfirmationDialog
            title={
              query.delete === "account"
                ? "Delete your account?"
                : "Delete workspace?"
            }
            description={`This permanently deletes ${counts?.projects} projects, ${counts?.notes} notes, all pages, files, agent connections and invitations. ${query.delete === "account" ? "You’ll be signed out and your Commons Google identity will be removed." : "Your account remains and an empty workspace replaces this one."} This cannot be undone.`}
            operation={`delete-${query.delete}`}
            label={
              query.delete === "account" ? "Delete account" : "Delete workspace"
            }
            closeHref={base}
          >
            <label className="field">
              <span>
                Type {query.delete === "account" ? "DELETE" : workspace.name} to
                confirm
              </span>
              <input name="confirmation" required autoComplete="off" />
            </label>
          </ConfirmationDialog>
        )}
      {selectedSession && (
        <ConfirmationDialog
          title="Revoke connection?"
          description={`End access for ${selectedSession.label}? ${selectedSession.current ? "This is your current session. You’ll be signed out." : "That browser or client will need to reconnect."}`}
          operation="revoke-session"
          label="Revoke connection"
          closeHref={base}
        >
          <input type="hidden" name="sessionId" value={selectedSession.id} />
        </ConfirmationDialog>
      )}
    </>
  );
}
