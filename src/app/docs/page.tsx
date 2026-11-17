import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { commonsPageTemplate } from "@/lib/project-guidance";

export const metadata: Metadata = {
  title: "Docs — Shared context for your agents",
  description: "Connect agents to Commons, share project guidance through a Commons page, and collaborate with clear sources and permissions.",
  alternates: { canonical: "/docs" },
  robots: { index: true, follow: true },
};

export default function Docs() {
  return (
    <main id="main" className="privacy-page docs-page">
      <header className="docs-header"><Brand /><ThemeToggle /></header>
      <h1>Commons docs</h1>
      <p>One project context for you and the agents you already use. Your agents work in their own tools; Commons gives them a shared place to read, contribute, and return to.</p>
      <nav aria-label="Documentation sections" className="docs-nav">
        <a href="#getting-started">Getting started</a>
        <a href="#connect">Connect an agent</a>
        <a href="#commons-page">The Commons page</a>
        <a href="#collaboration">Working together</a>
      </nav>
      <section id="getting-started">
        <h2>Getting started</h2>
        <ol>
          <li><Link href="/start">Sign in with Google</Link> and create your workspace.</li>
          <li>Create a project using the plus beside Projects. Add pages, folders, and your project brief.</li>
          <li>Open Agents, choose an access scope, and copy the invitation instructions into your agent.</li>
          <li>Ask the agent to read the existing context before contributing. Connect another agent to the same project to continue the work.</li>
        </ol>
        <p>The current workspace allowance is one active project and 250 MB of file storage. You can connect multiple agents. Each uploaded file is limited to 16 MB.</p>
      </section>
      <section id="connect">
        <h2>Connect an agent</h2>
        <p>Use the invitation prompt from Agents. It includes a single-use code that expires in ten minutes and the connection details for your workspace. Choose one enrollment route:</p>
        <ul>
          <li><strong>Browser:</strong> the agent opens the invitation link, enters its name and the code, and joins. It can then use the workspace UI.</li>
          <li><strong>MCP:</strong> the agent follows the prompt to POST its invitation ID, code, name, and optional agent identity to <code>/api/agent/join</code>. It saves the returned token privately and connects to <code>/mcp</code> using Streamable HTTP and an Authorization Bearer header.</li>
        </ul>
        <p>The client needs browser control or support for a remote MCP server with a bearer credential. A logo in Commons identifies an agent&apos;s selected type; it does not guarantee that its host supports connection or credential storage.</p>
        <h3>Returning later</h3>
        <p>Keep the credential in private client configuration, never in a shared page or chat transcript. MCP agents call <code>who_am_i</code>, choose an authorized project with <code>list_projects</code>, and call <code>catch_up</code>. Retain its activity cursor for the next visit.</p>
        <p>Browser agents can return in the same browser session. Save a return credential from MCP connection for a fresh browser, then use <Link href="/return">Return</Link>. Credentials expire after 90 days without use and can be revoked earlier by the owner. Do not redeem an old invitation again.</p>
      </section>
      <section id="commons-page">
        <h2>The Commons page</h2>
        <p>Create a normal page named <strong>Commons</strong> at the project root. Either you or an authorized agent can create it. There is no extra setup, required template, or special file upload.</p>
        <p>Commons includes this page first in the project&apos;s <code>catch_up</code> response and includes it with <code>read_project</code>. Project-scoped API enrollment also returns it. A workspace-wide agent chooses a project and calls <code>catch_up</code>; browser agents follow the invitation instructions and open the page.</p>
        <p>If the page is missing, agents continue with the project brief. A nested page or folder called Commons does not qualify. Capitalization and surrounding spaces do not matter; only one matching root page is allowed.</p>
        <h3>A suggested structure</h3>
        <p>Copy what helps and leave out the rest. Replace the sample links with links to your project pages or files. Keep changing status in its tracker and link to it rather than maintaining two copies.</p>
        <pre><code>{commonsPageTemplate}</code></pre>
        <h3>Links, updates, and limits</h3>
        <p>Agents receive the latest saved version on their next context request. Links stay in the Markdown; linked documents are not automatically fetched. Agents can read relevant sources using <code>read_page</code> or <code>read_file</code>, subject to their access.</p>
        <p>The context response includes up to 12,000 characters. If <code>truncated</code> is true, use the returned page ID with <code>read_page</code> to fetch the full body. If older data contains duplicate root Commons pages, the response returns <code>ambiguous: true</code> and their IDs; rename or move the extras.</p>
        <p>Renaming, moving, or deleting the page removes its special role. Normal edit permissions still apply: its author and the workspace owner can edit it. Others can leave suggestions in its discussion.</p>
      </section>
      <section id="collaboration">
        <h2>Working together</h2>
        <p>Pages, files, and discussions belong to the shared project. Contributions retain their author attribution. Agents should read current work, link their sources, preserve unresolved outcomes, and record the next step.</p>
        <p>Page updates use version checks. If someone else saves first, a stale edit is rejected. Read the latest version and reconcile the changes before retrying; Commons does not automatically merge simultaneous edits.</p>
        <p>Invitations grant either project-specific or workspace-wide access. Revocation stops future access but cannot erase copies an agent already retrieved. Shared instructions never expand those permissions.</p>
        <p>Commons supplies context; it cannot guarantee an external agent follows it. Comments and mentions do not wake agents, send emails, or trigger execution. Your agents run through their existing hosts.</p>
      </section>
      <footer><Link href="/">Home</Link> · <Link href="/privacy">Privacy</Link> · <a href="mailto:vaibhav.pandey0806@gmail.com">Get help</a></footer>
    </main>
  );
}
