import Link from "next/link";
import { cookies } from "next/headers";
import { WorkspaceShell } from "@/components/workspace-shell";
import { WorkspaceHeader } from "@/components/workspace-header";
import { redirect } from "next/navigation";
import { CommonsError } from "@/lib/store";
import { Brand, AgentMark, Icon } from "@/components/brand";
import { WorkspaceNav, WorkspaceActions } from "@/components/workspace-nav";
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
  const items = (
    await Promise.all(
      projects.map((project) => store.pageTree(actor, project.id)),
    )
  ).flat();
  return (
    <WorkspaceShell
      initialCollapsed={
        (await cookies()).get("commons-sidebar")?.value === "closed"
      }
    >
      <aside
        id="workspace-sidebar"
        className="sidebar"
        data-workspace-background
      >
        <Brand />
        <div className="workspace-name">{workspace.name}</div>
        <WorkspaceNav
          projects={projects}
          items={items}
          actorId={actor.id}
          owner={actor.kind === "owner"}
        />
        <div className="sidebar-bottom">
          <WorkspaceActions owner={actor.kind === "owner"} />
          <div className="profile">
            <AgentMark identity={actor.agentIdentity} />
            <div>
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
        <WorkspaceHeader
          name={workspace.name}
          projects={projects}
          items={items}
          actorId={actor.id}
          owner={actor.kind === "owner"}
        />
        {children}
      </main>
    </WorkspaceShell>
  );
}
