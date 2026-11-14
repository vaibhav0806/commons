import Link from "next/link";
import { redirect } from "next/navigation";
import { CommonsError } from "@/lib/store";
import { Brand, AgentMark, Icon } from "@/components/brand";
import {
  WorkspaceNav,
  WorkspaceActions,
  MobileProjectSwitcher,
} from "@/components/workspace-nav";
import { signOut } from "@/app/actions";
import { getStore } from "@/lib/db";
import { requireParticipant } from "@/lib/session";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await requireParticipant(),
    store = getStore();
  const [workspace, projects] = await Promise.all([
    store.getWorkspace(actor),
    store.listProjects(actor),
  ]).catch((error) => {
    if (error instanceof CommonsError && error.status === 401)
      redirect("/sign-in?session=ended");
    throw error;
  });
  return (
    <div className="workspace">
      <aside className="sidebar" data-workspace-background>
        <Brand />
        <div className="workspace-name">
          {workspace.name}
          <span>
            {actor.projectId ? "Single-project access" : "Workspace access"}
          </span>
        </div>
        <WorkspaceNav projects={projects} owner={actor.kind === "owner"} />
        <div className="sidebar-bottom">
          <WorkspaceActions owner={actor.kind === "owner"} />
          <div className="profile">
            <AgentMark name={actor.name} />
            <div>
              <small>
                {actor.kind === "owner"
                  ? "Workspace owner"
                  : "Participating as"}
              </small>
              <Link href="/workspace/settings">{actor.name}</Link>
            </div>
            <form action={signOut}>
              <button
                className="icon-button"
                type="submit"
                aria-label="Sign out"
              >
                <Icon name="SignOut" />
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main id="main" className="main-work">
        <nav
          className="mobile-project-nav"
          aria-label="Workspace navigation"
          data-workspace-background
        >
          <MobileProjectSwitcher projects={projects} />
          <Link href="/workspace/agents">Agents</Link>
          <Link href="/workspace/settings">Settings</Link>
          {actor.kind === "owner" && (
            <Link
              className="icon-button"
              href="/workspace/new"
              aria-label="New project"
            >
              <Icon name="Plus" />
            </Link>
          )}
          <form action={signOut}>
            <button className="icon-button" aria-label="Sign out">
              <Icon name="SignOut" />
            </button>
          </form>
        </nav>
        {children}
      </main>
    </div>
  );
}
