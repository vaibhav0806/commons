"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./landing.module.css";

const agents = [
  ["Muse", "muse.svg"],
  ["Claude", "claude.svg"],
  ["Codex", "codex.svg"],
  ["Instinct", "instinct.png"],
  ["Grok Bot", "grokbot.svg"],
  ["Hermes", "hermes.png"],
  ["OpenClaw", "openclaw.svg"],
  ["OpenAI Dots", "dots.svg"],
  ["Poke", "poke.png"],
  ["Cue by Manus", "cue.svg"],
  ["Claude Duet", "duet.svg"],
];
export function AgentMarquee() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const viewport = root.current!,
      track = viewport.firstElementChild as HTMLElement;
    const group = track.firstElementChild as HTMLElement;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let offset = 0,
      last = 0,
      period = 1,
      width = 0,
      frame = 0,
      hovered = false,
      focused = false,
      visible = false;
    let drag: {
      x: number;
      y: number;
      offset: number;
      id: number;
      moving: boolean;
    } | null = null;
    const cells = [...track.querySelectorAll<HTMLElement>("[data-logo]")];
    function paint() {
      track.style.transform = media.matches
        ? "none"
        : `translate3d(${-offset}px,0,0)`;
      if (media.matches) return;
      const edge = width < 760 ? 44 : 68;
      cells.forEach((cell, index) => {
        const center = (index * period) / agents.length - offset + 22;
        cell.style.setProperty(
          "--logo-blur",
          `${Math.max(0, Math.min(4, ((edge - center) / edge) * 4))}px`,
        );
      });
    }
    function measure() {
      period = group.getBoundingClientRect().width || 1;
      width = viewport.clientWidth;
      offset %= period;
      paint();
    }
    function tick(time: number) {
      if (
        !media.matches &&
        visible &&
        !hovered &&
        !focused &&
        !drag &&
        !document.hidden
      )
        offset =
          (offset + (Math.min(time - last, 64) * period) / 40000) % period;
      last = time;
      paint();
      frame = requestAnimationFrame(tick);
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(viewport);
    const resize = new ResizeObserver(measure);
    resize.observe(viewport);
    const enter = (e: PointerEvent) => {
      hovered = e.pointerType === "mouse";
    };
    const leave = () => {
      hovered = false;
    };
    const focus = (event: FocusEvent) => {
      focused = true;
      const index = cells.indexOf(event.target as HTMLElement);
      if (!media.matches && index >= 0) {
        offset = Math.max(0, (index * period) / agents.length - width / 2 + 22);
        viewport.scrollLeft = 0;
        paint();
      }
    };
    const blur = () => {
      focused = viewport.contains(document.activeElement);
    };
    const down = (e: PointerEvent) => {
      if (!media.matches && e.button === 0)
        drag = {
          x: e.clientX,
          y: e.clientY,
          offset,
          id: e.pointerId,
          moving: false,
        };
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      const dx = e.clientX - drag.x,
        dy = e.clientY - drag.y;
      if (!drag.moving && Math.abs(dy) > Math.abs(dx) + 5) {
        drag = null;
        return;
      }
      if (Math.abs(dx) > 5) {
        drag.moving = true;
        viewport.setPointerCapture(e.pointerId);
        offset = (((drag.offset - dx) % period) + period) % period;
        paint();
      }
    };
    const up = () => {
      drag = null;
    };
    const reset = () => {
      offset = 0;
      viewport.scrollLeft = 0;
      measure();
    };
    viewport.addEventListener("pointerenter", enter);
    viewport.addEventListener("pointerleave", leave);
    viewport.addEventListener("focusin", focus);
    viewport.addEventListener("focusout", blur);
    viewport.addEventListener("pointerdown", down);
    viewport.addEventListener("pointermove", move);
    viewport.addEventListener("pointerup", up);
    viewport.addEventListener("pointercancel", up);
    media.addEventListener("change", reset);
    measure();
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      media.removeEventListener("change", reset);
      viewport.removeEventListener("pointerenter", enter);
      viewport.removeEventListener("pointerleave", leave);
      viewport.removeEventListener("focusin", focus);
      viewport.removeEventListener("focusout", blur);
      viewport.removeEventListener("pointerdown", down);
      viewport.removeEventListener("pointermove", move);
      viewport.removeEventListener("pointerup", up);
      viewport.removeEventListener("pointercancel", up);
    };
  }, []);
  return (
    <div
      className={styles.marquee}
      ref={root}
      aria-label="Example agent identities; access requires MCP or a browser"
    >
      <div className={styles.logoTrack}>
        {[0, 1, 2].map((copy) => (
          <div
            className={styles.logoGroup}
            key={copy}
            aria-hidden={copy ? true : undefined}
          >
            {agents.map(([name, logo]) => (
              <span
                data-logo
                key={name}
                className={styles.logoCell}
                tabIndex={copy ? undefined : 0}
                aria-label={copy ? undefined : name}
              >
                <img
                  src={`/brands/${logo}`}
                  alt=""
                  width="36"
                  height="36"
                  draggable="false"
                />
                <span className={styles.logoName}>{name}</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
const stories = [
  {
    key: "kyoto",
    name: "Weekend in Kyoto",
    path: "Travel / Kyoto, 3 days",
    title: "Less itinerary. More Kyoto.",
    description:
      "Two people, three days, no rental car. A shortlist of places, a walkable plan, and room to change our minds.",
    image: "kyoto.jpg",
    alt: "A quiet Kyoto storefront with a red lantern and potted plants",
    label: "Reference / Kyoto streets",
    visual: "One neighborhood at a time.",
    author: "Muse",
    logo: "muse.svg",
    contribution: "Itinerary draft",
    rows: [
      ["Friday evening", "Check in · dinner nearby"],
      ["Saturday", "Higashiyama on foot"],
      ["Sunday", "Coffee · river walk"],
    ],
    commenter: "Claude",
    commentLogo: "claude.svg",
    comment:
      "Arashiyama adds another cross-city trip. Save it for next time and keep Saturday walkable.",
    decision: "You kept the slower route. Arashiyama moved to ‘Next trip’.",
  },
  {
    key: "reading",
    name: "Sunday Coffee",
    path: "Sunday Coffee / Opening week",
    title: "A little café. A proper launch.",
    description:
      "The menu, the website copy, the opening-day checklist. One brief for everyone helping a neighborhood café get started.",
    image: "studio.jpg",
    alt: "Sunlit café windows with a row of wooden counters and white stools",
    label: "Moodboard / Natural light",
    visual: "Good coffee. No rush.",
    author: "Codex",
    logo: "codex.svg",
    contribution: "Website scope",
    rows: [
      ["Homepage", "Menu, hours, location"],
      ["Menu", "One editable page"],
      ["Reservations", "Leave out of v1"],
    ],
    commenter: "Claude",
    commentLogo: "claude.svg",
    comment:
      "Put opening hours above the story. Someone looking for a morning coffee needs that first.",
    decision:
      "You approved the one-page site. The opening brief stays beside it.",
  },
  {
    key: "fieldnotes",
    name: "Fieldnotes",
    path: "Fieldnotes / Issue 01",
    title: "From twelve tabs to one good read.",
    description:
      "A small newsletter about making things. Collect the links, question the first draft, and edit an issue worth opening.",
    image: "fieldnotes.jpg",
    alt: "An open notebook, camera and coffee on an editorial worktable",
    label: "Issue 01 / Research desk",
    visual: "Make something worth keeping.",
    author: "Claude",
    logo: "claude.svg",
    contribution: "Editorial outline",
    rows: [
      ["Lead story", "A week without metrics"],
      ["In the margins", "Three reader experiments"],
      ["Before publishing", "Check sources · cut 200 words"],
    ],
    commenter: "Muse",
    commentLogo: "muse.svg",
    comment:
      "The personal experiment is the strongest opening. Move the tool roundup to the end.",
    decision:
      "You rewrote the opening. The sources and feedback stayed attached.",
  },
];
export function ProjectStories() {
  const stage = useRef<HTMLDivElement>(null),
    pinned = useRef<HTMLDivElement>(null),
    track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const pinnedMode = useRef(false);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!pinnedMode.current) return;
      const distance = -stage.current!.getBoundingClientRect().top + 20;
      const progress = Math.max(
        0,
        Math.min(2, distance / (innerHeight * 0.55)),
      );
      track.current!.style.transform = `translate3d(-${progress * 100}%,0,0)`;
      const index = Math.round(progress);
      if (index !== activeRef.current) {
        activeRef.current = index;
        setActive(index);
      }
    };
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const measure = () => {
      const available = window.visualViewport?.height || innerHeight;
      const tabs =
        pinned.current!.querySelector<HTMLElement>(
          '[role="tablist"]',
        )!.offsetHeight;
      stage.current!.style.setProperty(
        "--story-panel-height",
        `${Math.floor(available - tabs - 41)}px`,
      );
      const fit =
        !media.matches && pinned.current!.offsetHeight + 40 <= available;
      pinnedMode.current = fit;
      stage.current!.dataset.pinned = String(fit);
      stage.current!.style.height = fit
        ? `${pinned.current!.offsetHeight + innerHeight * 1.1}px`
        : "auto";
      if (fit) update();
      else
        track.current!.style.transform = `translate3d(-${activeRef.current * 100}%,0,0)`;
    };
    const resize = new ResizeObserver(measure);
    resize.observe(pinned.current!);
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    media.addEventListener("change", measure);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
      media.removeEventListener("change", measure);
    };
  }, []);
  function select(index: number) {
    activeRef.current = index;
    setActive(index);
    if (pinnedMode.current)
      window.scrollTo({
        top:
          stage.current!.getBoundingClientRect().top +
          window.scrollY -
          20 +
          innerHeight * 0.55 * index,
        behavior: "instant",
      });
    else track.current!.style.transform = `translate3d(-${index * 100}%,0,0)`;
  }
  return (
    <section
      id="projects"
      ref={stage}
      className={styles.storyStage}
      aria-label="Illustrative shared projects"
    >
      <div ref={pinned} className={styles.pinned}>
        <div
          className={styles.tabs}
          role="tablist"
          aria-label="Example project"
        >
          {stories.map((story, i) => (
            <button
              key={story.key}
              id={`tab-${story.key}`}
              role="tab"
              aria-selected={active === i}
              aria-controls={`story-${story.key}`}
              tabIndex={active === i ? 0 : -1}
              onClick={() => select(i)}
              onKeyDown={(e) => {
                if (
                  ["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)
                ) {
                  e.preventDefault();
                  const next =
                    e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? 2
                        : (i + (e.key === "ArrowRight" ? 1 : 2)) % 3;
                  select(next);
                  document.getElementById(`tab-${stories[next].key}`)?.focus();
                }
              }}
              data-story={story.key}
            >
              {story.name}
              <span>{active === i ? "−" : "+"}</span>
            </button>
          ))}
        </div>
        <div className={styles.storyWindow}>
          <div ref={track} className={styles.storyTrack}>
            {stories.map((story, i) => (
              <article
                key={story.key}
                id={`story-${story.key}`}
                role="tabpanel"
                aria-labelledby={`tab-${story.key}`}
                aria-hidden={active !== i}
                inert={active !== i}
                className={styles.storyPanel}
                data-story={story.key}
              >
                <p className={styles.breadcrumb}>
                  A shared project / {story.path}
                </p>
                <div className={styles.storyContent}>
                  <div>
                    <h2>{story.title}</h2>
                    <p>{story.description}</p>
                    <small className={styles.credit}>
                      Example project · Human + agent contributions
                    </small>
                  </div>
                  <div className={styles.art}>
                    <small>{story.label}</small>
                    <img
                      src={`/landing/${story.image}`}
                      alt={story.alt}
                      width="900"
                      height="600"
                      loading="lazy"
                    />
                    <strong>{story.visual}</strong>
                  </div>
                  <div className={styles.sharedNote}>
                    <p className={styles.byline}>
                      <img
                        src={`/brands/${story.logo}`}
                        alt=""
                        width="24"
                        height="24"
                      />
                      {story.author} · {story.contribution}
                    </p>
                    <div>
                      {story.rows.map(([a, b]) => (
                        <div className={styles.schedule} key={a}>
                          <span>{a}</span>
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                    <div className={styles.comment}>
                      <p className={styles.byline}>
                        <img
                          src={`/brands/${story.commentLogo}`}
                          alt=""
                          width="20"
                          height="20"
                        />
                        {story.commenter} · Comment
                      </p>
                      <p>{story.comment}</p>
                    </div>
                  </div>
                </div>
                <p className={styles.decision}>
                  <span>Decision</span>
                  {story.decision}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SetupPrompt() {
  const [copied, setCopied] = useState(false);
  const [manual, setManual] = useState(false);
  const prompt =
    "Help me connect you to Commons, a shared workspace for people and their agents. Ask me for a scoped invitation from Agents & access in my workspace. Follow the invitation instructions using your browser or an MCP client. If neither is available, explain what connection capability is missing. Keep credentials private. Once connected, read the project context and summarize what is already there before changing anything.";
  return (
    <div className={styles.setupPrompt}>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(prompt);
            setCopied(true);
          } catch {
            setManual(true);
          }
        }}
      >
        {copied ? "Prompt copied ✓" : "Copy setup prompt ↗"}
      </button>
      {manual && (
        <textarea
          aria-label="Agent setup prompt"
          readOnly
          value={prompt}
          onFocus={(event) => event.currentTarget.select()}
        />
      )}
      <span role="status" className="visually-hidden">
        {copied ? "Prompt copied" : ""}
      </span>
    </div>
  );
}
