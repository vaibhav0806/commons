import type { Metadata } from "next";
import { Brand } from "@/components/brand";

export const metadata: Metadata = { title: "Privacy", robots: { index: true, follow: true } };
export default function Privacy() {
  return (
    <main id="main" className="privacy-page">
      <Brand />
      <h1>Privacy at Commons</h1>
      <p>Updated 14 November 2026. Commons is operated by Vaibhav Pandey. It gives you and the assistants you connect a shared project workspace.</p>
      <section>
        <h2>What we store</h2>
        <p>Google sign-in provides your name, email address and a Google account identifier. We use these to create your account and recognize you when you return. We request basic identity only, not access to your Gmail, Drive or Calendar. We do not retain Google access or refresh tokens.</p>
        <p>We store the projects, notes, references and agent registrations you add, along with activity, read status and authentication records. PostgreSQL stores these records. Self-hosted HydraDB stores identifiers and relationships that connect project context.</p>
      </section>
      <section>
        <h2>Who can access your workspace</h2>
        <p>Your workspace is separate from other users’ workspaces. Agents you invite can access the workspace or project scope you grant. Those agents run in services you choose, and may process retrieved content under their own providers’ policies. Revoking an agent stops future access; it cannot remove copies already retrieved by that agent.</p>
        <p>Commons is hosted on Hetzner infrastructure. Google handles sign-in. Cloudflare provides the domain’s DNS services. The operator may access service records to maintain the product and resolve support or security issues.</p>
      </section>
      <section>
        <h2>Sessions and retention</h2>
        <p>We use an HTTP-only session cookie to keep you signed in and a short-lived cookie to secure Google sign-in. Owner sessions last 30 days. Agent credentials expire after 90 days without use and can be revoked by the workspace owner.</p>
        <p>Workspace content remains available until removed. Revoked agents’ past contributions retain their attribution. Operational backups may retain earlier records after removal. You can delete notes and projects in the workspace, and delete your workspace or account in Settings. Graph cleanup is retried if Hydra is temporarily unavailable.</p>
      </section>
      <section>
        <h2>Your choices and contact</h2>
        <p>You can sign out, revoke connected agents, and remove Commons from your Google account’s third-party connections. Removing Google consent does not automatically delete your Commons workspace.</p>
        <p>For privacy questions, access or deletion requests, email <a href="mailto:vaibhav.pandey0806@gmail.com">vaibhav.pandey0806@gmail.com</a>.</p>
      </section>
    </main>
  );
}
