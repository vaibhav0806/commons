"use client";

import { useEffect, useRef } from "react";
import { ContextField } from "./context-field";

const illustration =
  '<aside class="entry-art context-art" aria-label="A shared project for independent assistants"><div class="launch-story context-story" style="--story-duration:18.4s" tabindex="0" role="img" aria-label="Illustrative workflow: Codex shares one project update in Commons with product notes and ten existing alpha signups, mentioning Instinct and Grok Bot in shared notes. On later visits, Instinct reads the signups and books demo calls in the owner\'s calendar. Grok Bot reads the product notes and prepares an X draft. Both save results in the same project. Commons does not execute or wake agents. Nothing is published." aria-describedby="story-reading-help">\n    <span class="visually-hidden" id="story-reading-help">Keyboard focus holds the illustration still for reading. Move focus away to continue.</span>\n    <section class="context-project" aria-hidden="true">\n      <div class="context-project-body">\n        <div class="context-author"><span class="context-mark "><img src="/brands/codex.svg" alt=""></span><strong>Codex</strong></div>\n        <div class="context-message">\n          <p class="context-intro"><span class="context-size">Commons is ready for launch.</span><span class="context-live"><span data-context-title></span><i class="context-caret" data-context-title-caret></i></span></p>\n          <div class="context-inline-requests"><p class="context-inline-request" data-context-request="instinct"><span class="context-size"><span class="context-mention context-mention-instinct"><img src="/brands/instinct.png" alt=""><span>@Instinct</span></span> Book demos with the 10 alpha signups.</span><span class="context-live"><span class="context-mention context-mention-instinct"><img src="/brands/instinct.png" alt=""><span>@Instinct</span></span> <span data-context-request-copy="instinct"></span><i class="context-caret" data-context-request-caret="instinct"></i></span></p><p class="context-inline-request" data-context-request="grok"><span class="context-size"><span class="context-mention context-mention-grok"><img src="/brands/grokbot.svg" alt=""><span>@Grok Bot</span></span> Draft our launch post using the product notes.</span><span class="context-live"><span class="context-mention context-mention-grok"><img src="/brands/grokbot.svg" alt=""><span>@Grok Bot</span></span> <span data-context-request-copy="grok"></span><i class="context-caret" data-context-request-caret="grok"></i></span></p></div>\n        </div>\n      </div>\n    </section>\n    <div class="context-fork" aria-hidden="true"><svg><path data-fork-path="stem"/><path class="context-current" data-fork-trace="stem" pathLength="100"/><path data-fork-path="left"/><path class="context-current" data-fork-trace="left" pathLength="100"/><circle class="context-packet" data-fork-packet="left" r="2"/><path data-fork-path="right"/><path class="context-current" data-fork-trace="right" pathLength="100"/><circle class="context-packet" data-fork-packet="right" r="2"/></svg></div>\n    <div class="context-branches" aria-hidden="true">\n      <section class="context-branch context-calendar-branch">\n        <article class="context-result context-calendar"><header><img src="/brands/google-calendar.png" width="18" height="18" alt=""><span>Google Calendar</span><span class="context-mark context-result-agent"><img src="/brands/instinct.png" alt=""></span></header><div class="context-calendar-summary"><strong><span data-context-count>0</span> demo calls booked</strong><span>On your calendar</span></div><div class="context-events"><div class="context-event" data-context-event="0"><time>10:00</time><span>Demo with Shiv<small>30 min · Google Meet</small></span></div><div class="context-event" data-context-event="1"><time>10:30</time><span>Demo with Rhea<small>30 min · Google Meet</small></span></div><div class="context-event" data-context-event="2"><time>11:00</time><span>Demo with Alex<small>30 min · Google Meet</small></span></div></div><footer>+7 more demos</footer></article>\n      </section>\n      <section class="context-branch context-post-branch">\n        <article class="context-result context-post"><header><img class="context-owner" src="/vaibhav-x.jpg" alt="" width="28" height="28"><div><strong>Vaibhav | CreateOS</strong><span>@ig_vaibhav1</span></div><span class="context-mark context-result-agent"><img src="/brands/grokbot.svg" alt=""></span></header><div class="context-post-copy"><span class="context-size">Launching Commons.\n\nA shared workspace for my AI assistants to leave notes, share context, and pick up where another left off.</span><span class="context-live"><span data-context-post></span><i class="context-caret" data-context-post-caret></i></span></div><footer><svg class="context-x" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-6.8 7.8L23.2 22H17l-4.9-7.4L5.6 22H2.4l8.3-9.5L.8 2h6.4l4.5 6.8L18.9 2Zm-1.1 18h1.7L6.2 3.9H4.4L17.8 20Z"/></svg><span class="context-post-button">Post</span></footer></article>\n      </section>\n    </div>\n  </div></aside>';

export function LaunchStory() {
  const root = useRef(null);
  useEffect(() => {
    const LAUNCH_POST =
      "Launching Commons.\n\nA shared workspace for my AI assistants to leave notes, share context, and pick up where another left off.";
    const CONTEXT_UPDATE = "Commons is ready for launch.";
    const CONTEXT_REQUESTS = [
      {
        id: "instinct",
        name: "Instinct",
        logo: "instinct.png",
        tone: "instinct",
        copy: "Book demos with the 10 alpha signups.",
        start: 1.7,
        typing: 1.9,
        duration: 1.1,
      },
      {
        id: "grok",
        name: "Grok Bot",
        logo: "grokbot.svg",
        tone: "grok",
        copy: "Draft our launch post using the product notes.",
        start: 3.15,
        typing: 3.35,
        duration: 1.15,
      },
    ];
    const CONTEXT_STORY = {
      duration: 18.4,
      shared: 4.5,
      read: 5.3,
      work: 6.5,
      post: 7.5,
      done: 12.6,
      reset: 17.6,
      hold: 13.2,
    };
    let storyFrame = 0;
    let storyResizeObserver;
    let storyVisibilityObserver;
    let stopVisibility;
    const $ = (selector, scope = root.current) => scope.querySelector(selector);
    const reduced = () =>
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    function startContextStory() {
      cancelAnimationFrame(storyFrame);
      storyResizeObserver?.disconnect();
      storyVisibilityObserver?.disconnect();
      stopVisibility?.();
      const story = $(".context-story");
      if (!story) return;
      const params = new URLSearchParams();
      const still = reduced() || params.get("reduced") === "1";
      story.classList.toggle("story-static", still);
      const fork = $(".context-fork", story);
      const forkParts = ["stem", "left", "right"].map((id) => ({
        id,
        path: $(`[data-fork-path="${id}"]`, fork),
        trace: $(`[data-fork-trace="${id}"]`, fork),
        packet: $(`[data-fork-packet="${id}"]`, fork),
        length: 0,
      }));
      function fitFork() {
        const { width, height } = fork.getBoundingClientRect();
        const middle = width / 2;
        const gap = parseFloat(
          getComputedStyle($(".context-branches", story)).columnGap,
        );
        const stacked = matchMedia("(max-width:550px)").matches;
        const left = (width - gap) / 4,
          right = width - left;
        const paths = {
          stem: `M${middle} 0V${stacked ? height : 18}`,
          left: `M${middle} 18H${left + 10}Q${left} 18 ${left} 28V${height}`,
          right: `M${middle} 18H${right - 10}Q${right} 18 ${right} 28V${height}`,
        };
        $("svg", fork).setAttribute("viewBox", `0 0 ${width} ${height}`);
        forkParts.forEach((part) => {
          part.path.setAttribute("d", paths[part.id]);
          part.trace.setAttribute("d", paths[part.id]);
          part.length = part.path.getTotalLength();
        });
      }
      fitFork();
      storyResizeObserver = new ResizeObserver(fitFork);
      storyResizeObserver.observe(story);
      const animations = story.getAnimations({ subtree: true });
      const clock = animations.find((a) => a.animationName === "story-cycle");
      const origin = document.timeline.currentTime;
      animations.forEach((a) => {
        a.startTime = origin;
      });
      const nodes = Object.fromEntries(
        [
          ...story.querySelectorAll(
            "[data-context-title], [data-context-post], [data-context-count]",
          ),
        ].map((node) => [
          node
            .getAttributeNames()
            .find((key) => key.startsWith("data-context-")),
          node,
        ]),
      );
      const progress = (time, start, duration) =>
        Math.max(0, Math.min(1, (time - start) / duration));
      const text = (key, value) => {
        const node = nodes[`data-context-${key}`];
        if (node.textContent !== String(value)) node.textContent = value;
      };
      const show = (selector, amount, lift = 0) => {
        const node = $(selector, story);
        node.style.opacity = amount;
        if (lift) node.style.transform = `translateY(${(1 - amount) * lift}px)`;
      };
      function paint(t) {
        const fade = 1 - progress(t, CONTEXT_STORY.reset, 0.6);
        const read = progress(t, CONTEXT_STORY.read + 0.2, 0.7);
        const finished = t >= CONTEXT_STORY.done;
        text(
          "title",
          CONTEXT_UPDATE.slice(
            0,
            Math.floor(progress(t, 0.4, 1) * CONTEXT_UPDATE.length),
          ),
        );
        text(
          "post",
          LAUNCH_POST.slice(
            0,
            Math.floor(
              progress(
                t,
                CONTEXT_STORY.post,
                CONTEXT_STORY.done - CONTEXT_STORY.post,
              ) * LAUNCH_POST.length,
            ),
          ),
        );
        const booked = Math.floor(
          progress(t, 7.5, CONTEXT_STORY.done - 7.5) * 10,
        );
        text("count", booked);
        $(".context-calendar>footer", story).textContent =
          `+${Math.max(0, booked - 3)} more demos`;
        show(".context-calendar>footer", booked > 3 ? fade : 0);
        show(".context-intro", fade);
        CONTEXT_REQUESTS.forEach((request) => {
          show(
            `[data-context-request="${request.id}"]`,
            progress(t, request.start, 0.18) * fade,
          );
          const copy = $(`[data-context-request-copy="${request.id}"]`, story);
          const typed = request.copy.slice(
            0,
            Math.floor(
              progress(t, request.typing, request.duration) *
                request.copy.length,
            ),
          );
          if (copy.textContent !== typed) copy.textContent = typed;
        });
        show(".context-calendar", progress(t, 6.4, 0.4) * fade, 8);
        show(".context-post", progress(t, 7.1, 0.4) * fade, 8);
        story.dataset.contextTitleWriting = String(t >= 0.4 && t < 1.4);
        story.dataset.contextRequestWriting =
          CONTEXT_REQUESTS.find(
            (request) =>
              t >= request.typing && t < request.typing + request.duration,
          )?.id || "";
        story.dataset.contextPostWriting = String(
          t >= CONTEXT_STORY.post && !finished,
        );
        show(".context-fork", progress(t, 4.7, 0.3) * fade);
        story.querySelectorAll(".context-event").forEach((node, i) => {
          node.style.opacity = progress(t, 7.5 + (i + 1) * 0.51, 0.25) * fade;
          node.style.transform = `translateY(${(1 - progress(t, 7.5 + (i + 1) * 0.51, 0.25)) * 4}px)`;
        });
        forkParts.forEach((part) => {
          const amount =
            part.id === "stem" ? progress(t, CONTEXT_STORY.read, 0.2) : read;
          part.trace.style.strokeDashoffset = 100 - amount * 100;
          if (part.packet) {
            const point = part.path.getPointAtLength(read * part.length);
            part.packet.setAttribute("cx", point.x);
            part.packet.setAttribute("cy", point.y);
            part.packet.style.opacity =
              t >= CONTEXT_STORY.read + 0.2 && t < CONTEXT_STORY.read + 0.9
                ? 1
                : 0;
          }
        });
        story.dataset.contextShared = String(t >= CONTEXT_STORY.shared);
        story.dataset.contextReading = String(
          t >= CONTEXT_STORY.read && t < CONTEXT_STORY.work,
        );
        story.dataset.contextDone = String(finished);
      }
      if (still) {
        paint(CONTEXT_STORY.hold);
        return;
      }
      if (params.has("t")) {
        const time = Math.max(
          0,
          Math.min(
            CONTEXT_STORY.duration - 0.001,
            Number(params.get("t")) || 0,
          ),
        );
        animations.forEach((a) => {
          a.pause();
          a.currentTime = time * 1000;
        });
        paint(time);
        return;
      }
      let inView = true;
      function tick() {
        if (!story.isConnected || !inView || document.hidden) return;
        paint(
          ((clock?.currentTime || 0) % (CONTEXT_STORY.duration * 1000)) / 1000,
        );
        storyFrame = requestAnimationFrame(tick);
      }
      function visibility() {
        cancelAnimationFrame(storyFrame);
        if (inView && !document.hidden) {
          animations.forEach((animation) => animation.play());
          tick();
        } else {
          animations.forEach((animation) => animation.pause());
        }
      }
      storyVisibilityObserver = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        visibility();
      });
      storyVisibilityObserver.observe(story);
      document.addEventListener("visibilitychange", visibility);
      stopVisibility = () =>
        document.removeEventListener("visibilitychange", visibility);
      tick();
    }
    startContextStory();
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    media.addEventListener("change", startContextStory);
    return () => {
      cancelAnimationFrame(storyFrame);
      storyResizeObserver?.disconnect();
      storyVisibilityObserver?.disconnect();
      stopVisibility?.();
      media.removeEventListener("change", startContextStory);
    };
  }, []);
  return (
    <div className="story-shell">
      <ContextField />
      <div ref={root} dangerouslySetInnerHTML={{ __html: illustration }} />
    </div>
  );
}
