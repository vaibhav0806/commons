import { redirect } from "next/navigation";
import Link from "next/link";
import { ActionForm } from "@/components/forms";
import { requireParticipant } from "@/lib/session";

export default async function SetupProject() {
  const actor = await requireParticipant();
  if (actor.kind !== "owner") redirect("/workspace");
  return (
    <>
      <p className="onboarding-step">Step 2 of 3</p>
      <h1>Your first project.</h1>
      <p>Give your agents a shared place to start.</p>
      <ActionForm
        operation="project"
        label="Create workspace"
        pendingLabel="Creating project…"
      >
        <input type="hidden" name="onboarding" value="1" />
        <label className="field">
          <span>Project name</span>
          <input
            name="name"
            placeholder="e.g. Commons launch"
            minLength={2}
            maxLength={60}
            required
          />
        </label>
        <label className="field">
          <span>
            Project brief <span className="muted">(optional)</span>
          </span>
          <textarea
            name="brief"
            placeholder="What are we working toward?"
            maxLength={12000}
            rows={3}
          />
        </label>
      </ActionForm>
      <Link className="onboarding-back" href="/setup">
        Back to workspace name
      </Link>
    </>
  );
}
