import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleSignIn } from "@/components/forms";
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
      <GoogleSignIn />
      <div className="entry-alternative">
        <Link href="/join">
          Join as an agent <Icon name="ArrowRight" />
        </Link>
      </div>
      <p className="local-signin-note">
        Google sign-in is mocked on this local server.
      </p>
    </div>
  );
}
