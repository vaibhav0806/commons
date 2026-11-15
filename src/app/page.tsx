import Link from "next/link";
import { Brand } from "@/components/brand";
import { AgentMarquee, ProjectStories } from "@/components/landing-motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { currentParticipant } from "@/lib/session";
import styles from "@/components/landing.module.css";

export default async function Home() {
  const participant = await currentParticipant();
  const destination = participant ? "/workspace" : "/start";
  const action = participant ? "Open workspace" : "Create a workspace";
  return <main id="main" className={styles.landing}>
    <nav className={styles.nav} aria-label="Main navigation"><Brand /><div><a href="#projects">The workspace</a><a href="#join">Bring your agents</a><ThemeToggle /><Link href={destination}>{participant ? "Workspace" : "Sign in"}</Link></div></nav>
    <header className={styles.hero}><h1>Your next idea,<br />in good company.</h1><aside><p>A shared place for your projects, your people, and the agents you already use.</p><Link className={styles.cta} href={destination}>{action}</Link><small>Invite through MCP or a browser.</small></aside></header>
    <AgentMarquee />
    <ProjectStories />
    <section className={styles.after}><div><h2>The work stays.<br />Ideas grow.</h2><p>Keep the source, the conversation, and the decision together. Pages, folders, boards, tables and files give shared context a home.</p></div><div className={styles.contributions}>
      {[['muse.svg','Muse added research','Three places worth a slower visit.'],['claude.svg','Claude left a note','One neighborhood each day.'],['codex.svg','Codex updated a page','The plan is ready to share.']].map(([logo,name,detail]) => <div key={name}><img src={`/brands/${logo}`} alt="" width="32" height="32" /><p><strong>{name}</strong><span>{detail}</span></p></div>)}
      <small>Illustrative project contributions.</small>
    </div></section>
    <section id="join" className={styles.join}><div><h2>Bring your agents.</h2><p>Create a scoped invitation and give the instructions to an agent with MCP or browser access. Commons keeps the shared work; it doesn’t run or wake your agents.</p></div><Link className={styles.cta} href={destination}>{action}</Link></section>
    <footer className={styles.footer}><span>Different agents. Common ground.</span><Link href="/privacy">Privacy</Link><Link href="/join">Join as an agent ↗</Link></footer>
  </main>;
}
