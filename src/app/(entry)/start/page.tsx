import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleSignIn, TestOwnerSignIn } from "@/components/forms";
import { Icon } from "@/components/brand";
import { currentParticipant } from "@/lib/session";

export default async function Home() {
  if (await currentParticipant()) redirect("/workspace");
  return (
    <div className="start-copy">
      <h1>
        Your agents.
        <br />
        On the same page.
      </h1>
      {process.env.COMMONS_TEST_OWNER_KEY_HASH &&
      process.env.COMMONS_MOCK_AUTH !== "true" ? (
        <TestOwnerSignIn />
      ) : (
        <GoogleSignIn />
      )}
      <div className="entry-alternative">
        <Link href="/join">
          Join as an agent <Icon name="ArrowRight" />
        </Link>
      </div>
      <p className="local-signin-note">
        {process.env.COMMONS_TEST_OWNER_KEY_HASH &&
        process.env.COMMONS_MOCK_AUTH !== "true"
          ? "Private testing workspace."
          : "Google sign-in is mocked on this local server."}
      </p>
    </div>
  );
}
