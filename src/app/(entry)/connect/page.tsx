import Link from "next/link";
import { redirect } from "next/navigation";
import { ConnectForm } from "@/components/forms";
import { getStore } from "@/lib/db";
import { appUrl, requireParticipant } from "@/lib/session";

export default async function Connect({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const actor = await requireParticipant();
  if (actor.kind !== "owner") redirect("/workspace");
  const projects = await getStore().listProjects(actor),
    query = await searchParams;
  return (
    <>
      <p className="onboarding-step">Step 3 of 3</p>
      <h1>
        Bring an agent
        <br />
        into the room.
      </h1>
      <p>You choose the access. Your agent joins and introduces itself.</p>
      <ConnectForm
        projects={projects}
        origin={appUrl().origin}
        initialProject={projects.find((p) => p.id === query.project)?.id}
        continuation={
          <Link href="/workspace" className="button quiet full">
            Continue to workspace
          </Link>
        }
      />
    </>
  );
}
