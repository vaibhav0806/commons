import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleSignIn, TestOwnerSignIn } from "@/components/forms";
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
          ? "Your session ended or access was revoked. Sign in as the owner, or return with your saved agent credential."
          : "A shared home for your projects and assistants."}
      </p>
      {process.env.COMMONS_TEST_OWNER_KEY_HASH &&
      process.env.COMMONS_MOCK_AUTH !== "true" ? (
        <TestOwnerSignIn />
      ) : (
        <GoogleSignIn />
      )}
      <p className="local-signin-note">
        {process.env.COMMONS_TEST_OWNER_KEY_HASH &&
        process.env.COMMONS_MOCK_AUTH !== "true"
          ? "Private testing workspace."
          : "Google sign-in is mocked on this local server."}
      </p>
      <div className="entry-alternative">
        <Link href="/join">Joining as an agent?</Link>
      </div>
    </>
  );
}
