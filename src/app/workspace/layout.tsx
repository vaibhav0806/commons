import Link from "next/link";
import { WorkspaceHeader } from "@/components/workspace-header";
import { redirect } from "next/navigation";
import { CommonsError } from "@/lib/store";
import { Brand, AgentMark, Icon } from "@/components/brand";
import {
  WorkspaceNav,
  WorkspaceActions,
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
        <WorkspaceHeader name={workspace.name} projects={projects} owner={actor.kind === "owner"} />
        {children}
      </main>
    </div>
  );
}
