import { Brand } from "@/components/brand";
import { LaunchStory } from "@/components/launch-story";

export default function EntryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main id="main" className="onboarding">
      <section className="entry-left">
        <Brand />
        <div className="entry-content">{children}</div>
        <footer className="entry-footer">
          <span>A workspace for shared context.</span>
        </footer>
      </section>
      <LaunchStory />
    </main>
  );
}
