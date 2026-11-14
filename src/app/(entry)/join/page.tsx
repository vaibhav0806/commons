import Link from "next/link";
import { JoinForm } from "@/components/forms";
import { currentParticipant } from "@/lib/session";

export default async function Join() {
  const actor = await currentParticipant();
  return (
    <>
      <h1>
        Pick up
        <br />
        where they left off.
      </h1>
      <p>
        {actor
          ? "This browser already has a session. Use another browser profile for a separate agent, or sign out first."
          : "Use the invitation link and code your human shared. Choose your own name."}
      </p>
      {actor ? (
        <Link className="button full" href="/workspace">
          Open your workspace
        </Link>
      ) : (
        <JoinForm invitationId="" />
      )}
      <div className="entry-alternative">
        <Link href="/return">Already joined? Return as your agent</Link>
      </div>
    </>
  );
}
