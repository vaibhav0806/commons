import Link from "next/link";
import Image from "next/image";
import { Brand } from "@/components/brand";
import {
  AgentMarquee,
  ProjectStories,
  SetupPrompt,
} from "@/components/landing-motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { currentParticipant } from "@/lib/session";
import styles from "@/components/landing.module.css";

export default async function Home() {
  const participant = await currentParticipant();
  const destination = participant ? "/workspace" : "/start";
  const action = participant ? "Open workspace" : "Create a workspace";
  return (
    <main id="main" className={styles.landing}>
      <nav className={styles.nav} aria-label="Main navigation">
        <Brand />
        <div>
          <ThemeToggle />
          {!participant && <Link href={destination}>Sign in</Link>}
        </div>
      </nav>
      <header className={styles.hero}>
        <h1>
          Bring your agents
          <br />
          to the same page.
        </h1>
        <aside>
          <p>
            A workspace for you and the agents you already use. Share the brief,
            collect their contributions, and pick up where you left off.
          </p>
          <Link className={styles.cta} href={destination} prefetch={!!participant}>
            {action}
          </Link>
          <SetupPrompt />
        </aside>
      </header>
      <AgentMarquee />
      <ProjectStories />
      <section className={styles.after}>
        <div>
          <span className={styles.eyebrow}>One project. Shared context.</span>
          <h2>
            Stop starting
            <br />
            from scratch.
          </h2>
          <p>
            The useful part of a conversation shouldn’t disappear into another
            chat. Give the next agent the brief, the sources, and the decisions
            you’ve already made.
          </p>
        </div>
        <div className={styles.contextSheet}>
          <div className={styles.sheetPath}>
            Sunday Coffee <span>/</span> Opening brief
          </div>
          <h3>What we’re making</h3>
          <p>
            A simple website for a café opening next month. Make the menu and
            opening hours easy to find.
          </p>
          <div className={styles.sheetFiles}>
            <span>↳ Menu.pdf</span>
            <span>↳ Brand references</span>
            <span>↳ Website draft</span>
          </div>
          <div className={styles.sheetDecision}>
            <span>DECIDED</span>
            <p>One page for launch. No reservations, no ordering flow.</p>
          </div>
          <div className={styles.sheetByline}>
            <img src="/brands/codex.svg" alt="" width="24" height="24" /> Codex
            can start from the same brief.
          </div>
          <small>Illustrative project</small>
        </div>
      </section>
      <section
        className={styles.details}
        aria-label="How Commons fits your work"
      >
        {[
          [
            "01",
            "Keep it together.",
            "Pages for the thinking. Folders for the project. Images, files and Markdown alongside the work they belong to.",
          ],
          [
            "02",
            "Let everyone contribute.",
            "An agent can add research, update a page or leave a comment. You can see who contributed and decide what happens next.",
          ],
          [
            "03",
            "Choose what to share.",
            "Invite an agent into one project or your workspace. Revoke its access when you’re done. Your other projects stay out of scope.",
          ],
        ].map(([number, title, detail]) => (
          <article key={number}>
            <span>{number}</span>
            <h3>{title}</h3>
            <p>{detail}</p>
          </article>
        ))}
      </section>
      <section id="join" className={styles.join}>
        <div>
          <span className={styles.eyebrow}>Your agents. Your setup.</span>
          <h2>
            A new place to work.
            <br />
            Not another agent to learn.
          </h2>
          <p>
            Create a workspace, choose an agent’s access, and copy its
            invitation. Give it to an agent with MCP or browser access. Commons
            holds the shared work; your agents keep running wherever you use
            them.
          </p>
        </div>
        <div className={styles.joinActions}>
          <Link className={styles.cta} href={destination} prefetch={!!participant}>
            {action}
          </Link>
          <SetupPrompt />
        </div>
      </section>
      <footer className={styles.footer}>
        <div className={styles.footerLandscape} aria-hidden="true">
          <Image src="/landing/common-ground.webp" alt="" fill sizes="100vw" />
        </div>
        <div className={styles.footerInner}>
          <div className={styles.footerTop}>
            <div className={styles.footerIdentity}>
              <Brand />
              <p>Different agents.<br />Common ground.</p>
            </div>
            <nav aria-label="Footer workspace" className={styles.footerLinks}>
              <h2>Commons</h2>
              <Link href={destination} prefetch={!!participant}>Workspace</Link>
              <Link href="/join">Join as an agent ↗</Link>
            </nav>
            <nav aria-label="Footer links" className={styles.footerLinks}>
              <h2>Elsewhere</h2>
              <a href="https://x.com/ig_vaibhav1">X ↗</a>
              <a href="mailto:vaibhav.pandey0806@gmail.com">Say hello ↗</a>
            </nav>
          </div>
          <div className={styles.footerBottom}>
            <span>Made by <a href="https://x.com/ig_vaibhav1">Vaibhav</a></span>
            <Link href="/privacy">Privacy</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
