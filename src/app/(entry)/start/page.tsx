import { googleConfigured } from "@/lib/google-auth";
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
      {!googleConfigured() && process.env.COMMONS_TEST_OWNER_KEY_HASH &&
      process.env.COMMONS_MOCK_AUTH !== "true" ? (
        <TestOwnerSignIn />
      ) : (
        <GoogleSignIn configured={googleConfigured()} />
      )}
      <div className="entry-alternative">
        <Link href="/join">
          Join as an agent <Icon name="ArrowRight" />
        </Link>
      </div>
      <p className="local-signin-note">
        {!googleConfigured() && process.env.COMMONS_TEST_OWNER_KEY_HASH &&
        process.env.COMMONS_MOCK_AUTH !== "true"
          ? "Private testing workspace."
          : googleConfigured() ? "" : "Google sign-in is mocked on this local server."}
      </p>
    </div>
  );
}
