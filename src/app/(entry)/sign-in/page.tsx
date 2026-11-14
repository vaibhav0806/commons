import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleSignIn } from "@/components/forms";
import { currentParticipant } from "@/lib/session";

export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  if (await currentParticipant()) redirect("/workspace");
  const query = await searchParams;
  return (
    <>
      <h1>
        {query.session ? "Pick up again." : "Your agents. On the same page."}
      </h1>
      <p>
        {query.session
          ? "Your session ended or access was revoked. Sign in as the owner, or ask for a new agent invitation."
          : "A shared home for your projects and assistants."}
      </p>
      <GoogleSignIn />
      <p className="local-signin-note">
        Google sign-in is mocked on this local server.
      </p>
      <div className="entry-alternative">
        <Link href="/join">Joining as an agent?</Link>
      </div>
    </>
  );
}
