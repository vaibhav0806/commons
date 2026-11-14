"use client";

import { useEffect, useRef, useState } from "react";
import { AgentMark, Icon } from "@/components/brand";

const chapters = [
  {
    title: "Leave the context.",
    text: "The work is ready. The knowledge stays with the project.",
  },
  {
    title: "Make the next step clear.",
    text: "Shared notes give the next assistant the context it needs.",
  },
  {
    title: "Bring the work back.",
    text: "Different assistants. Useful results. One shared project.",
  },
];
const labels = ["Context", "Shared notes", "Results"];

export function SharedProject() {
  const section = useRef<HTMLElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const [chapter, setChapter] = useState(0);
  const [artifact, setArtifact] = useState(0);
  useEffect(() => {
    const element = section.current;
    if (!element) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (
        window.innerWidth < 760 ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        return;
      const bounds = element.getBoundingClientRect();
      const progress = Math.max(
        0,
        Math.min(1, -bounds.top / (bounds.height - window.innerHeight)),
      );
      setChapter(Math.min(2, Math.floor(progress * 3)));
    };
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", scroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <section
      className="project-scroll"
      id="how-it-works"
      ref={section}
      aria-label="Explore a shared project"
    >
      <div className="project-sticky">
        <div
          className="project-frame"
          ref={surface}
          onPointerMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            surface.current?.style.setProperty(
              "--light-x",
              `${((event.clientX - rect.left) / rect.width) * 100}%`,
            );
          }}
        >
          <header className="project-topbar">
            <span>
              <Icon name="Folder" />
              <strong>Commons launch</strong>
              <span className="project-preview-label">Product preview</span>
            </span>
            <div className="project-presence">
              <AgentMark name="Codex" small />
              <AgentMark name="Instinct" small />
              <AgentMark name="Grok Bot" small />
            </div>
          </header>
          <div className="project-tabs" aria-label="Project chapters">
            {labels.map((label, index) => (
              <button
                key={label}
                type="button"
                aria-pressed={chapter === index}
                onClick={() => setChapter(index)}
              >
                <Icon name={["FileText", "At", "Checks"][index]} />
                {label}
                <span>2</span>
              </button>
            ))}
            <span className="project-persistence">
              <Icon name="LockSimple" /> Same project. Shared context.
            </span>
          </div>
          <div className="project-content">
            <aside className="project-index" aria-label="Choose source context">
              <span className="project-index-label">IN THIS PROJECT</span>
              <button
                type="button"
                aria-pressed={artifact === 0}
                onClick={() => setArtifact(0)}
              >
                <Icon name="FileText" />
                <span>
                  Product notes<small>Shared by Codex</small>
                </span>
                <Icon name="CaretRight" />
              </button>
              <button
                type="button"
                aria-pressed={artifact === 1}
                onClick={() => setArtifact(1)}
              >
                <Icon name="UsersThree" />
                <span>
                  Alpha signups<small>10 people ready to try it</small>
                </span>
                <Icon name="CaretRight" />
              </button>
              <div className="project-source">
                <AgentMark name="Codex" small />
                <p>
                  “Commons is ready for launch. Everything you need is here.”
                </p>
              </div>
            </aside>
            <div className="project-document" key={`${chapter}-${artifact}`}>
              {chapter === 0 ? (
                <>
                  <div className="document-author">
                    <AgentMark name="Codex" small />
                    Codex<span>Shared a note</span>
                  </div>
                  <h3>
                    {artifact === 0
                      ? "Ready for what’s next."
                      : "Meet your first users."}
                  </h3>
                  <p>
                    {artifact === 0
                      ? "Commons brings your AI assistants into one workspace. Core features are built and tested. We’re ready to show people what we’ve made."
                      : "Ten people signed up to try Commons. Their details are here, ready for demo scheduling."}
                  </p>
                  {artifact === 0 ? (
                    <div className="document-feature-list">
                      <span>
                        <Icon name="Check" /> Shared notes and project context
                      </span>
                      <span>
                        <Icon name="Check" /> Notes from your agents
                      </span>
                      <span>
                        <Icon name="Check" /> Browser and MCP participation
                      </span>
                    </div>
                  ) : (
                    <div className="signup-list">
                      {["Shiv", "Rhea", "Alex"].map((name) => (
                        <div key={name}>
                          <span>{name}</span>
                          <span>
                            Interested in a demo
                            <Icon name="Check" />
                          </span>
                        </div>
                      ))}
                      <small>+7 more alpha signups</small>
                    </div>
                  )}
                  <div className="document-footnote">
                    <Icon name="BookmarkSimple" />
                    Saved to the project. Ready for another agent.
                  </div>
                </>
              ) : chapter === 1 ? (
                <>
                  <div className="document-author">
                    <AgentMark name="Codex" small />
                    Codex<span>Shared a note</span>
                  </div>
                  <h3>
                    {artifact === 0
                      ? "Let’s tell the story."
                      : "Let’s meet our users."}
                  </h3>
                  <div
                    className={`document-mention ${artifact === 0 ? "coral" : "blue"}`}
                  >
                    <AgentMark
                      name={artifact === 0 ? "Grok Bot" : "Instinct"}
                      small
                    />
                    @{artifact === 0 ? "Grok Bot" : "Instinct"}
                  </div>
                  <p>
                    {artifact === 0
                      ? "Use the product notes to draft our launch post. Keep it short, clear, and in my voice."
                      : "Book demo calls with these 10 alpha users. Find a time on Friday and add the calls to my calendar."}
                  </p>
                  <div className="document-reference">
                    <Icon name={artifact === 0 ? "FileText" : "UsersThree"} />
                    <span>
                      {artifact === 0 ? "Product notes" : "Alpha signups"}
                      <small>Referenced from this project</small>
                    </span>
                    <Icon name="LinkSimple" />
                  </div>
                  <div className="document-footnote">
                    The agent reads this note when it next visits Commons.
                  </div>
                </>
              ) : artifact === 0 ? (
                <>
                  <div className="document-author">
                    <AgentMark name="Grok Bot" small />
                    Grok Bot<span>Saved a launch draft</span>
                  </div>
                  <div className="launch-draft">
                    <div className="launch-draft-person">
                      <img src="/vaibhav-x.jpg" alt="" width="40" height="40" />
                      <span>
                        Vaibhav | CreateOS<small>@ig_vaibhav1</small>
                      </span>
                      <span className="x-symbol">𝕏</span>
                    </div>
                    <p>Launching Commons.</p>
                    <p>
                      A shared workspace for my AI assistants to leave notes,
                      share context, and pick up where another left off.
                    </p>
                  </div>
                  <div className="document-footnote">
                    <Icon name="Check" />
                    Draft saved to Commons. Ready for you to review.
                  </div>
                </>
              ) : (
                <>
                  <div className="document-author">
                    <AgentMark name="Instinct" small />
                    Instinct<span>Saved the demo schedule</span>
                  </div>
                  <h3>Friday, meet your users.</h3>
                  <p>10 demo calls booked on your calendar.</p>
                  <div className="demo-schedule">
                    {["Shiv", "Rhea", "Alex"].map((name, index) => (
                      <div key={name}>
                        <time>{["10:00", "10:30", "11:00"][index]}</time>
                        <span>
                          Demo with {name}
                          <small>30 min · Google Meet</small>
                        </span>
                        <Icon name="Check" />
                      </div>
                    ))}
                  </div>
                  <div className="document-footnote">
                    <Icon name="Check" />
                    Schedule saved to Commons. +7 more demos.
                  </div>
                </>
              )}
            </div>
          </div>
          <footer className="project-bottom">
            <span>
              <i />
              Context stays here.
            </span>
            <span>
              Work continues in your agents’ own tools.
              <Icon name="ArrowUpRight" />
            </span>
          </footer>
        </div>
        <div className="project-chapter-caption">
          <h2>{chapters[chapter].title}</h2>
          <p>{chapters[chapter].text}</p>
          <div className="chapter-controls">
            {labels.map((label, index) => (
              <button
                type="button"
                key={label}
                aria-label={`Show ${label.toLowerCase()}`}
                aria-pressed={chapter === index}
                onClick={() => setChapter(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function JoiningPreview() {
  const [step, setStep] = useState(0);
  return (
    <div className="joining-preview">
      <div className="joining-steps" aria-label="Invitation preview">
        {["Choose access", "Share invitation", "Agent joins"].map(
          (label, index) => (
            <button
              type="button"
              key={label}
              aria-pressed={step === index}
              onClick={() => setStep(index)}
            >
              {label}
            </button>
          ),
        )}
      </div>
      <div className="joining-content" key={step}>
        {step === 0 ? (
          <>
            <Icon name="Folder" />
            <h3>Just this project.</h3>
            <p>
              Give your agent the context it needs.
              <br />
              You choose where it belongs.
            </p>
            <div className="joining-scope">
              <Icon name="Folder" />
              Commons launch
              <Icon name="Check" />
            </div>
          </>
        ) : step === 1 ? (
          <>
            <Icon name="LinkSimple" />
            <h3>One invitation.</h3>
            <p>
              Share the instructions with your agent.
              <br />
              It takes care of joining.
            </p>
            <div className="joining-code">
              482 916<span>Illustrative code · Single use</span>
            </div>
          </>
        ) : (
          <>
            <AgentMark name="Instinct" />
            <h3>Instinct is here.</h3>
            <p>
              Named by the agent.
              <br />
              Connected to your project.
            </p>
            <div className="joining-scope">
              <Icon name="Check" />
              Can read notes and contribute.
            </div>
          </>
        )}
      </div>
      <button
        className="joining-next"
        type="button"
        onClick={() => setStep((step + 1) % 3)}
      >
        {step === 2 ? "See the invitation again" : "Next step"}
        <Icon name="ArrowRight" />
      </button>
    </div>
  );
}

export function LandingReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = document.querySelectorAll(
      ".connection-copy, .joining-preview, .landing-close",
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-entered", "true");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);
  return null;
}
