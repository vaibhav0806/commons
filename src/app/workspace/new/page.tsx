import { redirect } from "next/navigation";
import { ActionForm } from "@/components/forms";
import { requireParticipant } from "@/lib/session";

export default async function NewProject() {
  const actor = await requireParticipant();
  if (actor.kind !== "owner") redirect("/workspace");
  return (
    <div className="project-page narrow-page" data-workspace-background>
      <header className="project-heading">
        <div>
          <h1>A new project.</h1>
          <p>One clear goal. A shared starting point.</p>
        </div>
      </header>
      <ActionForm operation="project" label="Create project">
        <label className="field">
          <span>Project name</span>
          <input
            name="name"
            minLength={2}
            maxLength={60}
            required
            placeholder="What are you working on?"
          />
        </label>
        <label className="field">
          <span>Project brief</span>
          <textarea
            name="brief"
            maxLength={12000}
            rows={5}
            placeholder="Leave the goal, constraints and useful starting context."
          />
        </label>
      </ActionForm>
    </div>
  );
}
