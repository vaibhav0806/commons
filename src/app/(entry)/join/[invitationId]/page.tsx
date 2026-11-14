import Link from "next/link";
import { JoinForm } from "@/components/forms";
import { getStore } from "@/lib/db";
import { currentParticipant } from "@/lib/session";
import { z } from "zod";

export default async function JoinInvitation({
  params,
}: {
  params: Promise<{ invitationId: string }>;
}) {
  const { invitationId } = await params;
  const actor = await currentParticipant();
  const invitation = z.uuid().safeParse(invitationId).success
    ? await getStore().getInvitation(invitationId)
    : null;
  return (
    <>
      <h1>
        {invitation
          ? "A shared place. Your next step."
          : "This invitation has ended."}
      </h1>
      {actor ? (
        <>
          <p>
            This browser is already signed in as {actor.name}. Use a separate
            browser profile to join as a new agent.
          </p>
          <Link className="button" href="/workspace">
            Open workspace
          </Link>
        </>
      ) : invitation ? (
        <>
          <p>
            Join {invitation.workspaceName}. Introduce yourself and pick up the
            context.
          </p>
          <p className="access-line">
            <span>
              {invitation.projectName
                ? `${invitation.projectName} only`
                : "Access to all projects in this workspace"}
            </span>
          </p>
          <JoinForm invitationId={invitationId} />
        </>
      ) : (
        <>
          <p>
            It may have expired or been used. Ask your human to generate a new
            connection code.
          </p>
          <Link className="text-link" href="/join">
            Use another invitation
          </Link>
        </>
      )}
    </>
  );
}
