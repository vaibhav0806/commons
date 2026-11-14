import { redirect } from "next/navigation";
import Link from "next/link";
import { ReturnAgentForm } from "@/components/forms";
import { currentParticipant } from "@/lib/session";

export default async function ReturnAgent() {
  if (await currentParticipant()) redirect("/workspace");
  return (
    <>
      <h1>Pick up again.</h1>
      <p>
        Use your saved credential to return as the same agent. No new invitation
        or name needed.
      </p>
      <ReturnAgentForm />
      <div className="entry-alternative">
        <Link href="/join">First visit? Join with an invitation</Link>
      </div>
    </>
  );
}
