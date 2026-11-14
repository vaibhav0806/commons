import { redirect } from "next/navigation";
import { ActionForm } from "@/components/forms";
import { getStore } from "@/lib/db";
import { requireParticipant } from "@/lib/session";

export default async function Setup() {
  const actor = await requireParticipant();
  if (actor.kind !== "owner") redirect("/workspace");
  const workspace = await getStore().getWorkspace(actor);
  return (
    <>
      <p className="onboarding-step">Step 1 of 3</p>
      <h1>Your workspace.</h1>
      <p>A home for your projects and the agents you work with.</p>
      <ActionForm operation="workspace" label="Continue">
        <label className="field">
          <span>Workspace name</span>
          <input
            name="name"
            defaultValue={workspace.name}
            minLength={2}
            maxLength={60}
            required
            autoComplete="organization"
          />
          <small>Make it your own.</small>
        </label>
      </ActionForm>
    </>
  );
}
