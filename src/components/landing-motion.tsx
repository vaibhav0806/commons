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
          `${Math.max(0, Math.min(4, ((edge - Math.min(center, width - center)) / edge) * 4))}px`,
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
    path: "Travel / Weekend in Kyoto",
    title: "A slower kind of weekend.",
    description:
      "A place to collect the places, compare the plans, and decide together.",
    label: "Neighborhood notes",
    visual: "Leave room to wander.",
    author: "Muse",
    logo: "muse.svg",
    contribution: "First draft",
    rows: [
      ["Friday", "Arrive. Settle in."],
      ["Saturday", "Walk. Eat. Wander."],
      ["Sunday", "Keep it open."],
    ],
    commenter: "Claude",
    commentLogo: "claude.svg",
    comment: "One neighborhood each day. Let the rest happen.",
  },
  {
    key: "reading",
    name: "Reading room",
    path: "Personal / Reading room",
    title: "Follow a thought a little further.",
    description:
      "Keep the passages, questions, and unexpected connections in one shared place.",
    label: "A note in the margin",
    visual: "Stay with the question.",
    author: "Claude",
    logo: "claude.svg",
    contribution: "Reading list",
    rows: [
      ["On the desk", "Ways of Seeing"],
      ["Up next", "The Creative Act"],
      ["In the margins", "Your questions"],
    ],
    commenter: "Muse",
    commentLogo: "muse.svg",
    comment: "No single reading. Keep both perspectives.",
  },
  {
    key: "fieldnotes",
    name: "Fieldnotes",
    path: "Publishing / Fieldnotes",
    title: "Three ideas. A point of view.",
    description:
      "Collect the sources, shape the opening, and give the first issue a clear direction.",
    label: "First issue / Cover study",
    visual: "Stay curious.",
    author: "Codex",
    logo: "codex.svg",
    contribution: "Website approach",
    rows: [
      ["Reading", "One clear column"],
      ["Stories", "Three useful ideas"],
      ["Sources", "Beside each claim"],
    ],
    commenter: "Claude",
    commentLogo: "claude.svg",
    comment: "Connect the three ideas. That’s where the story is.",
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
        Math.min(2, (distance - innerHeight * 0.3) / innerHeight),
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
      const fit =
        !media.matches &&
        pinned.current!.offsetHeight + 40 <=
          (window.visualViewport?.height || innerHeight);
      pinnedMode.current = fit;
      stage.current!.dataset.pinned = String(fit);
      stage.current!.style.height = fit
        ? `${pinned.current!.offsetHeight + innerHeight * 2.6}px`
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
          innerHeight * (index + 0.3),
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
                      {story.author} contributed.
                      <br />
                      {story.commenter} left a note.
                      <br />
                      You chose the direction.
                    </small>
                  </div>
                  <div className={styles.art}>
                    <small>{story.label}</small>
                    <svg viewBox="0 0 320 180" aria-hidden="true">
                      {i === 0 ? (
                        <>
                          <path d="M0 160 115 28 250 160Z" fill="#AFBDD7" />
                          <path d="m120 170 120-126 100 126Z" fill="#C7B3C4" />
                          <circle cx="280" cy="28" r="18" fill="#C7B3C4" />
                        </>
                      ) : i === 1 ? (
                        <>
                          <rect
                            x="10"
                            y="35"
                            width="85"
                            height="130"
                            fill="#AFBDD7"
                          />
                          <rect
                            x="112"
                            y="15"
                            width="85"
                            height="150"
                            fill="#C7B3C4"
                          />
                          <rect
                            x="214"
                            y="60"
                            width="85"
                            height="105"
                            fill="#AFBDD7"
                          />
                        </>
                      ) : (
                        <>
                          <rect
                            x="10"
                            y="5"
                            width="300"
                            height="165"
                            fill="#AFBDD7"
                          />
                          <circle cx="250" cy="55" r="32" fill="#C7B3C4" />
                          <text
                            x="32"
                            y="135"
                            fontFamily="Instrument Serif"
                            fontSize="110"
                            fill="#414D63"
                          >
                            F / 01
                          </text>
                        </>
                      )}
                    </svg>
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
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
