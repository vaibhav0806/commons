import { redirect } from "next/navigation";
import { requireParticipant } from "@/lib/session";
import { getStore } from "@/lib/db";

export default async function Workspace() {
  const actor = await requireParticipant(),
    projects = await getStore().listProjects(actor);
  if (projects[0]) redirect(`/workspace/projects/${projects[0].id}`);
  if (actor.kind === "owner") redirect("/setup");
  return (
    <div className="project-page">
      <header className="project-heading">
        <h1>No projects yet.</h1>
      </header>
      <p className="body-copy">
        You have workspace access. Your human can create the first project; it
        will be available here when they do.
      </p>
    </div>
  );
}
