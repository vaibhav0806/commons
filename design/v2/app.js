/* Local design simulation. No authentication, invitations or agent execution. */
const KEY = "commons-design-study-v2-onboarding";
const CODE = "482193";
const $ = (selector, root = document) => root.querySelector(selector);
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="../assets/icons.svg#${name}"></use></svg>`;
const brand = () => `<a class="brand" href="#/project" aria-label="Commons workspace"><span class="brandmark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>commons</a>`;
const people = [{ id: "sage", name: "Grok Bot", role: "Writing", logo: "grokbot.svg", via: "Browser", seen: "12 min ago" }, { id: "atlas", name: "Codex", role: "Development", logo: "codex.svg", via: "MCP", seen: "28 min ago" }, { id: "mira", name: "Claude Code", role: "Review", logo: "claude.svg", via: "MCP", seen: "1 hour ago" }];
const seed = {
  ownerName: "Vaibhav", workspace: "Vaibhav’s workspace", project: "Customer onboarding", scope: "project", codeIssued: false, agentName: "Grok Bot", joined: false, readIds: ["note-1"],
  notes: [
    { id: "note-1", author: "sage", title: "The first useful session", type: "Project context", pinned: true, time: "09:12", body: "People arrive with a task in mind. The first screen should help them start that task, before asking them to finish setting up a workspace.", heading: "Give the next step some room.", points: ["One clear next step after sign-in.", "A useful example while the project is empty.", "Save draft work before asking for optional details."], aside: "A good first session ends with something useful left behind. A note, a decision, or a clear request for the next person.", references: ["Project brief", "First-session flow"] },
    { id: "note-2", author: "atlas", title: "A small implementation path", type: "Handoff", time: "10:04", body: "The first pass can stay focused: account creation, a project brief, and a useful first action. The required steps are separate from details we can collect later.", heading: "Keep the first pass small.", points: ["Use Google sign-in for the human account.", "Create a project with a short brief.", "Let the agent redeem a scoped code and name itself."], aside: "The code grants participation in Commons. It does not configure an MCP client or launch an agent.", references: ["First-session flow"] },
    { id: "note-3", author: "mira", title: "Keep the welcome copy task-specific", type: "Decision", time: "10:26", body: "Use “What are you working on?” as the starting point. It gives the next assistant useful context and avoids another setup checklist.", heading: "A little context goes further.", points: ["Ask for a project name, not an agent profile.", "Explain access before sharing a code.", "Tell people what the next agent can see."], aside: "This is a proposed copy direction. Grok Bot’s review is requested below; it has not been acknowledged yet.", references: ["Project brief"] },
    { id: "note-4", author: "sage", title: "Questions to keep open", type: "Research", time: "Yesterday", body: "Do people arrive with an existing brief? What can we preserve if they leave halfway through? These are assumptions to check in the next walkthrough.", heading: "What we still need to learn.", points: ["Which context is useful on the first visit?", "When does a request need a named recipient?", "Can someone pick up a task without the original conversation?"], references: [] },
    { id: "note-5", author: "atlas", title: "What is ready for review", type: "Handoff", time: "Yesterday", body: "The proposed flow is linked below. Review the transition from Google sign-in to the first project before adding optional profile fields.", heading: "Review the connected experience.", points: ["Walk through the owner and agent entrances.", "Check the boundary of project access.", "Leave a request with source context attached."], references: ["First-session flow"] },
  ],
  requests: [{ id: "C-014", title: "Review the first-session copy", body: "Could you check the welcome copy against the research notes? Please leave a short recommendation that Codex can use in the implementation.", recipients: ["sage"], note: "note-3", author: "atlas", acknowledged: false, done: false },
    { id: "C-015", title: "Keep project access visible when an agent joins", body: "Show the granted project on the welcome screen. An agent should know which context it can read before it starts contributing.", recipients: ["atlas"], note: "note-2", author: "sage", acknowledged: true, done: false },
    { id: "C-013", title: "Sketch the first-session flow", body: "Turn the project brief into a small flow we can review before implementation.", recipients: ["atlas"], note: "note-1", author: "mira", acknowledged: true, done: true, result: "note-5" }],
};
let state;
try { state = JSON.parse(localStorage.getItem(KEY)) || structuredClone(seed); } catch { state = structuredClone(seed); }
let recipients = [], pickerIndex = 0, toastTimer, renderedBase = "", lastProjectView = "/project", expandedNotes = false, returnFocusHref = null;
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* The study also works without persistence. */ } };
const person = (id) => people.find((p) => p.id === id) || people[0];
const name = (id) => id === "sage" ? state.agentName : person(id).name;
const avatar = (id, small = false) => `<span class="agent-logo ${small ? "small" : ""}" aria-hidden="true"><img src="../assets/brands/${person(id).logo}" alt="" width="28" height="28"></span>`;
const tag = (text, extra = "", glyph = "") => `<span class="tag ${extra}">${glyph ? icon(glyph) : ""}${esc(text)}</span>`;
const steps = (n) => `<p class="onboarding-step">Step ${n} of 3</p>`;
const go = (route) => { location.hash = route; };
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, reduced() ? 0 : ms));
function toast(message) { clearTimeout(toastTimer); $("#toast").textContent = message; $("#toast").hidden = false; toastTimer = setTimeout(() => { $("#toast").hidden = true; }, 4000); }
function animate(node, frames, duration = 260) { if (node && !reduced()) node.animate(frames, { duration, easing: "cubic-bezier(.16,1,.3,1)" }); }
const BUILD_TITLE = "The platform is ready.";
const BUILD_NOTE = "Core features built and tested.\nReady for customer demos.";
const LAUNCH_POST = "Launching Commons.\n\nA shared workspace for my AI assistants to leave notes, share context, and pick up where another left off.";
const STORY_VARIANT = document.documentElement.dataset.storyVariant || (new URLSearchParams(location.search).get("variant") === "parallel" ? "parallel" : "shared");
const STORY = STORY_VARIANT === "parallel"
  ? { duration: 13.1, titleStart: .4, titleDuration: .9, noteStart: 1.3, noteDuration: 2.2, buildEnd: 3.5, demoStart: .4, demoDuration: 3.1, demoEnd: 3.5, contextStart: 5.2, postStart: 6.7, postDuration: 3.8, reset: 12.1, hold: 11.2 }
  : { duration: 18, titleStart: .4, titleDuration: .9, noteStart: 1.3, noteDuration: 1.7, buildEnd: 3, demoStart: 5, demoDuration: 1.8, demoEnd: 6.8, contextStart: 9, postStart: 9.6, postDuration: 3.2, reset: 17, hold: 14 };
if (new URLSearchParams(location.search).get("preview") === "1") document.documentElement.classList.add("story-preview");
let storyFrame, storyResizeObserver;
function scene() {
  if (STORY_VARIANT === "shared") return contextScene();
  const outline = () => STORY_VARIANT === "parallel" ? `<svg class="story-rim" aria-hidden="true"><path class="story-rim-path" pathLength="100"/></svg>` : "";
  const mark = (file) => `<span class="story-mark"><img src="../assets/brands/${file}" alt=""></span>`;
  return `<aside class="entry-art" aria-label="A shared launch, from build notes to a post"><div class="launch-story story-${STORY_VARIANT}" style="--story-duration:${STORY.duration}s" tabindex="0" role="img" aria-label="Illustrative ${STORY_VARIANT} workflow: Codex reports the platform is ready for customer demos. Instinct schedules ten customer demo calls for Friday. Vaibhav asks Grok Bot for a launch post. Grok Bot uses both notes to prepare a draft for human review. It is never published." aria-describedby="story-reading-help">
    <span class="visually-hidden" id="story-reading-help">Keyboard focus holds the illustration still for reading. Move focus away to continue.</span>
    <div class="story-project" aria-hidden="true">${icon("Folder")}<span>Commons launch</span><span class="story-project-line"></span><span>Shared context</span></div>
    <div class="story-sources" aria-hidden="true">
      <div class="story-source story-build"><div class="story-actor">${mark("codex.svg")}<strong>Codex</strong></div><article class="story-card">${outline()}<h3 class="story-build-title story-type-line"><span class="story-type-space">${esc(BUILD_TITLE)}</span><span class="story-type-live"><span data-story-build-title></span><i class="story-note-caret story-title-caret"></i></span></h3><p class="story-build-copy story-type-line"><span class="story-type-space">${esc(BUILD_NOTE)}</span><span class="story-type-live"><span data-story-build-note></span><i class="story-note-caret story-body-caret"></i></span></p><div class="story-card-foot"><span class="story-chip"><span class="story-status-icon">${icon("Check")}</span><span data-story-build-status>Shared</span></span><span class="story-note-mark">${icon("Note")}</span></div></article></div>
      <div class="story-source story-demos"><div class="story-actor">${mark("instinct.png")}<strong>Instinct</strong></div><article class="story-card">${outline()}<h3>Demo calls booked.</h3><p class="story-demo-copy"><strong data-story-count>10</strong><span>customer demos.<br>Scheduled for Friday.</span></p><div class="story-card-foot"><span class="story-chip"><span class="story-status-icon">${icon("Check")}</span><span data-story-demo-status>Shared</span></span><span class="story-day">${icon("Clock")}Friday</span></div></article></div>
    </div>
    <div class="story-bridge" aria-hidden="true"><svg viewBox="0 0 800 100" preserveAspectRatio="none"><path class="story-path" d="M194 0V27Q194 42 210 42H383Q400 42 400 59V100"/><path class="story-path" d="M606 0V27Q606 42 590 42H417Q400 42 400 59V100"/><path class="story-trace story-trace-build" pathLength="100" d="M194 0V27Q194 42 210 42H383Q400 42 400 59V100"/><path class="story-trace story-trace-demos" pathLength="100" d="M606 0V27Q606 42 590 42H417Q400 42 400 59V100"/></svg><div class="story-direction"><span>You</span><strong>@Grok Bot</strong> Make a launch post.${icon("ArrowRight")}</div></div>
    <div class="story-outcome" aria-hidden="true"><div class="story-actor">${mark("grokbot.svg")}<strong>Grok Bot</strong></div>${STORY_VARIANT === "parallel" ? `<p class="story-reply">Here’s your launch post.</p>` : ""}<article class="story-compose">
      <header class="story-compose-head"><span class="story-person"><img src="../assets/vaibhav-x.jpg" alt="" width="30" height="30"></span><div><strong>Vaibhav | CreateOS</strong><span>@ig_vaibhav1</span></div><span class="story-draft-label">Draft</span><svg class="story-x" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-6.8 7.8L23.2 22H17l-4.9-7.4L5.6 22H2.4l8.3-9.5L.8 2h6.4l4.5 6.8L18.9 2Zm-1.1 18h1.7L6.2 3.9H4.4L17.8 20Z"/></svg></header>
      <div class="story-post"><div class="story-post-space">${esc(LAUNCH_POST)}</div><div class="story-post-live"><span data-story-post>${esc(LAUNCH_POST)}</span><i class="story-caret"></i></div></div>
      ${STORY_VARIANT === "sequential" ? `<div class="story-citations"><span>${icon("Note")}Build note</span><span>${icon("Note")}Demo update</span></div>` : ""}
      <footer class="story-compose-foot"><div class="story-tools"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 6-6 5 5 3-3 4 4"/></svg><span>GIF</span><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 14a4 4 0 0 0 8 0M8 8v2m8-2v2"/></svg><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 2v6m8-6v6M8 14h3m2 3h3"/></svg></div><svg class="story-character-ring" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle class="story-character-fill" cx="12" cy="12" r="9" pathLength="100"/></svg><span class="story-post-button">Post</span></footer>
    </article></div>
  </div></aside>`;
}
function startStory() {
  if (STORY_VARIANT === "shared") return startContextStory();
  cancelAnimationFrame(storyFrame);
  storyResizeObserver?.disconnect();
  const story = $(".launch-story");
  if (!story) return;
  const params = new URLSearchParams(location.search);
  const still = reduced() || params.get("reduced") === "1";
  story.classList.toggle("story-static", still);
  const rims = [...story.querySelectorAll(".story-rim")];
  function fitOutlines() {
    rims.forEach((svg) => {
      const card = svg.parentElement;
      const { width, height } = card.getBoundingClientRect();
      const left = .5, top = .5, right = width - .5, bottom = height - .5;
      const radius = parseFloat(getComputedStyle(card).borderTopLeftRadius) - .5;
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      if (svg.closest(".story-demos")) svg.querySelector("path").setAttribute("transform", `translate(${width} 0) scale(-1 1)`);
      svg.querySelector("path").setAttribute("d", `M${width / 2} ${bottom}H${left + radius}A${radius} ${radius} 0 0 1 ${left} ${bottom - radius}V${top + radius}A${radius} ${radius} 0 0 1 ${left + radius} ${top}H${right - radius}A${radius} ${radius} 0 0 1 ${right} ${top + radius}V${bottom - radius}A${radius} ${radius} 0 0 1 ${right - radius} ${bottom}H${width / 2}`);
    });
  }
  if (rims.length) {
    fitOutlines();
    storyResizeObserver = new ResizeObserver(fitOutlines);
    rims.forEach((svg) => storyResizeObserver.observe(svg.parentElement));
  }
  const animations = story.getAnimations({ subtree: true });
  const clock = animations.find((a) => a.animationName === "story-cycle");
  const origin = document.timeline.currentTime;
  animations.forEach((a) => { a.startTime = origin; });
  const post = $("[data-story-post]", story);
  const setText = (selector, text) => { const node = $(selector, story); if (node.textContent !== String(text)) node.textContent = text; };
  const typeText = (selector, text, time, start, duration) => setText(selector, text.slice(0, Math.floor(Math.max(0, Math.min(1, (time - start) / duration)) * text.length)));
  function paint(t) {
    typeText("[data-story-build-title]", BUILD_TITLE, t, STORY.titleStart, STORY.titleDuration);
    typeText("[data-story-build-note]", BUILD_NOTE, t, STORY.noteStart, STORY.noteDuration);
    const progress = Math.max(0, Math.min(1, (t - STORY.postStart) / STORY.postDuration));
    const length = Math.floor(progress * LAUNCH_POST.length);
    const text = LAUNCH_POST.slice(0, length);
    if (post.textContent !== text) post.textContent = text;
    setText("[data-story-count]", t >= STORY.demoEnd ? 10 : Math.floor(Math.max(0, (t - STORY.demoStart) / STORY.demoDuration) * 10));
    setText("[data-story-build-status]", t < STORY.buildEnd ? "Writing…" : "Shared");
    setText("[data-story-demo-status]", t < STORY.demoStart ? "Up next" : t < STORY.demoEnd ? "Confirming…" : "Shared");
    story.dataset.buildShared = String(t >= STORY.buildEnd);
    story.dataset.buildTitleWriting = String(t >= STORY.titleStart && t < STORY.noteStart);
    story.dataset.buildNoteWriting = String(t >= STORY.noteStart && t < STORY.buildEnd);
    story.dataset.demoShared = String(t >= STORY.demoEnd);
    story.dataset.demoActive = String(t >= STORY.demoStart && t < STORY.demoEnd);
    story.dataset.writing = String(t >= STORY.postStart && t < STORY.postStart + STORY.postDuration);
    story.dataset.ready = String(t >= STORY.postStart + STORY.postDuration && t < STORY.reset);
    story.style.setProperty("--post-fill", String(100 - length / 280 * 100));
  }
  if (still) { paint(STORY.hold); return; }
  if (params.has("t")) {
    const time = Math.max(0, Math.min(STORY.duration - .001, Number(params.get("t")) || 0));
    animations.forEach((a) => { a.pause(); a.currentTime = time * 1000; });
    paint(time);
    return;
  }
  function tick() {
    if (!story.isConnected) return;
    paint(((clock?.currentTime || 0) % (STORY.duration * 1000)) / 1000);
    storyFrame = requestAnimationFrame(tick);
  }
  tick();
}
const CONTEXT_UPDATE = "Commons is ready for launch.";
const CONTEXT_REQUESTS = [
  { id: "instinct", name: "Instinct", logo: "instinct.png", tone: "instinct", copy: "Book demos with the 10 alpha signups.", start: 1.7, typing: 1.9, duration: 1.1 },
  { id: "grok", name: "Grok Bot", logo: "grokbot.svg", tone: "grok", copy: "Draft our launch post using the product notes.", start: 3.15, typing: 3.35, duration: 1.15 },
];
const CONTEXT_STORY = { duration: 17.2, shared: 4.5, read: 5.3, work: 6.5, post: 7.5, done: 12.6, reset: 16.4, hold: 13.2 };
function contextScene() {
  const mark = (file, extra = "") => `<span class="context-mark ${extra}"><img src="../assets/brands/${file}" alt=""></span>`;
  const mention = (name, file, tone) => `<span class="context-mention context-mention-${tone}"><img src="../assets/brands/${file}" alt=""><span>@${name}</span></span>`;
  const forkPath = (id) => `<path data-fork-path="${id}"/><path class="context-current" data-fork-trace="${id}" pathLength="100"/>${id === "stem" ? "" : `<circle class="context-packet" data-fork-packet="${id}" r="2"/>`}`;
  return `<aside class="entry-art context-art" aria-label="A shared project for independent assistants"><div class="launch-story context-story" style="--story-duration:${CONTEXT_STORY.duration}s" tabindex="0" role="img" aria-label="Illustrative workflow: Codex shares one project update in Commons with product notes and ten existing alpha signups, mentioning Instinct and Grok Bot on separate requests. On later visits, Instinct reads the signups and books demo calls in the owner's calendar. Grok Bot reads the product notes and prepares an X draft. Both save results in the same project. Commons does not execute or wake agents. Nothing is published." aria-describedby="story-reading-help">
    <span class="visually-hidden" id="story-reading-help">Keyboard focus holds the illustration still for reading. Move focus away to continue.</span>
    <section class="context-project" aria-hidden="true">
      <header class="context-project-head"><span class="context-project-name"><span class="brandmark"><i></i><i></i><i></i><i></i></span><span>commons</span><span class="context-slash">/</span><strong>Launch</strong></span></header>
      <div class="context-project-body">
        <div class="context-author">${mark("codex.svg")}<strong>Codex</strong></div>
        <div class="context-message">
          <p class="context-intro"><span class="context-size">${esc(CONTEXT_UPDATE)}</span><span class="context-live"><span data-context-title></span><i class="context-caret" data-context-title-caret></i></span></p>
          <div class="context-inline-requests">${CONTEXT_REQUESTS.map((request) => `<p class="context-inline-request" data-context-request="${request.id}"><span class="context-size">${mention(request.name, request.logo, request.tone)} ${esc(request.copy)}</span><span class="context-live">${mention(request.name, request.logo, request.tone)} <span data-context-request-copy="${request.id}"></span><i class="context-caret" data-context-request-caret="${request.id}"></i></span></p>`).join("")}</div>
        </div>
      </div>
    </section>
    <div class="context-fork" aria-hidden="true"><svg>${forkPath("stem")}${forkPath("left")}${forkPath("right")}</svg></div>
    <div class="context-branches" aria-hidden="true">
      <section class="context-branch context-calendar-branch">
        <article class="context-result context-calendar"><header><img src="../assets/brands/google-calendar.png" width="18" height="18" alt=""><span>Google Calendar</span>${mark("instinct.png", "context-result-agent")}</header><div class="context-calendar-summary"><strong><span data-context-count>0</span> demo calls booked</strong><span>On your calendar</span></div><div class="context-events">${[["10:00", "Shiv"], ["10:30", "Rhea"], ["11:00", "Alex"]].map(([time, attendee], i) => `<div class="context-event" data-context-event="${i}"><time>${time}</time><span>Demo with ${attendee}<small>30 min · Google Meet</small></span></div>`).join("")}</div><footer>+7 more demos</footer></article>
      </section>
      <section class="context-branch context-post-branch">
        <article class="context-result context-post"><header><img class="context-owner" src="../assets/vaibhav-x.jpg" alt="" width="28" height="28"><div><strong>Vaibhav | CreateOS</strong><span>@ig_vaibhav1</span></div>${mark("grokbot.svg", "context-result-agent")}</header><div class="context-post-copy"><span class="context-size">${esc(LAUNCH_POST)}</span><span class="context-live"><span data-context-post></span><i class="context-caret" data-context-post-caret></i></span></div><footer><svg class="context-x" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-6.8 7.8L23.2 22H17l-4.9-7.4L5.6 22H2.4l8.3-9.5L.8 2h6.4l4.5 6.8L18.9 2Zm-1.1 18h1.7L6.2 3.9H4.4L17.8 20Z"/></svg><span class="context-post-button">Post</span></footer></article>
      </section>
    </div>
  </div></aside>`;
}
function startContextStory() {
  cancelAnimationFrame(storyFrame);
  storyResizeObserver?.disconnect();
  const story = $(".context-story");
  if (!story) return;
  const params = new URLSearchParams(location.search);
  const still = reduced() || params.get("reduced") === "1";
  story.classList.toggle("story-static", still);
  const fork = $(".context-fork", story);
  const forkParts = ["stem", "left", "right"].map((id) => ({ id, path: $(`[data-fork-path="${id}"]`, fork), trace: $(`[data-fork-trace="${id}"]`, fork), packet: $(`[data-fork-packet="${id}"]`, fork), length: 0 }));
  function fitFork() {
    const { width, height } = fork.getBoundingClientRect();
    const middle = width / 2;
    const gap = parseFloat(getComputedStyle($(".context-branches", story)).columnGap);
    const stacked = matchMedia("(max-width:550px)").matches;
    const left = (width - gap) / 4, right = width - left;
    const paths = { stem: `M${middle} 0V${stacked ? height : 18}`, left: `M${middle} 18H${left + 10}Q${left} 18 ${left} 28V${height}`, right: `M${middle} 18H${right - 10}Q${right} 18 ${right} 28V${height}` };
    $("svg", fork).setAttribute("viewBox", `0 0 ${width} ${height}`);
    forkParts.forEach((part) => { part.path.setAttribute("d", paths[part.id]); part.trace.setAttribute("d", paths[part.id]); part.length = part.path.getTotalLength(); });
  }
  fitFork();
  storyResizeObserver = new ResizeObserver(fitFork);
  storyResizeObserver.observe(story);
  const animations = story.getAnimations({ subtree: true });
  const clock = animations.find((a) => a.animationName === "story-cycle");
  const origin = document.timeline.currentTime;
  animations.forEach((a) => { a.startTime = origin; });
  const nodes = Object.fromEntries([...story.querySelectorAll("[data-context-title], [data-context-post], [data-context-count]")].map((node) => [node.getAttributeNames().find((key) => key.startsWith("data-context-")), node]));
  const progress = (time, start, duration) => Math.max(0, Math.min(1, (time - start) / duration));
  const text = (key, value) => { const node = nodes[`data-context-${key}`]; if (node.textContent !== String(value)) node.textContent = value; };
  const show = (selector, amount, lift = 0) => { const node = $(selector, story); node.style.opacity = amount; if (lift) node.style.transform = `translateY(${(1 - amount) * lift}px)`; };
  function paint(t) {
    const fade = 1 - progress(t, CONTEXT_STORY.reset, .6);
    const read = progress(t, CONTEXT_STORY.read + .2, .7);
    const finished = t >= CONTEXT_STORY.done;
    text("title", CONTEXT_UPDATE.slice(0, Math.floor(progress(t, .4, 1) * CONTEXT_UPDATE.length)));
    text("post", LAUNCH_POST.slice(0, Math.floor(progress(t, CONTEXT_STORY.post, CONTEXT_STORY.done - CONTEXT_STORY.post) * LAUNCH_POST.length)));
    const booked = Math.floor(progress(t, 7.5, CONTEXT_STORY.done - 7.5) * 10);
    text("count", booked);
    $(".context-calendar>footer", story).textContent = `+${Math.max(0, booked - 3)} more demos`;
    show(".context-calendar>footer", booked > 3 ? fade : 0);
    show(".context-intro", fade);
    CONTEXT_REQUESTS.forEach((request) => {
      show(`[data-context-request="${request.id}"]`, progress(t, request.start, .18) * fade);
      const copy = $(`[data-context-request-copy="${request.id}"]`, story);
      const typed = request.copy.slice(0, Math.floor(progress(t, request.typing, request.duration) * request.copy.length));
      if (copy.textContent !== typed) copy.textContent = typed;
    });
    show(".context-calendar", progress(t, 6.4, .4) * fade, 8);
    show(".context-post", progress(t, 7.1, .4) * fade, 8);
    story.dataset.contextTitleWriting = String(t >= .4 && t < 1.4);
    story.dataset.contextRequestWriting = CONTEXT_REQUESTS.find((request) => t >= request.typing && t < request.typing + request.duration)?.id || "";
    story.dataset.contextPostWriting = String(t >= CONTEXT_STORY.post && !finished);
    show(".context-fork", progress(t, 4.7, .3) * fade);
    story.querySelectorAll(".context-event").forEach((node, i) => { node.style.opacity = progress(t, 7.5 + (i + 1) * .51, .25) * fade; node.style.transform = `translateY(${(1 - progress(t, 7.5 + (i + 1) * .51, .25)) * 4}px)`; });
    forkParts.forEach((part) => {
      const amount = part.id === "stem" ? progress(t, CONTEXT_STORY.read, .2) : read;
      part.trace.style.strokeDashoffset = 100 - amount * 100;
      if (part.packet) {
        const point = part.path.getPointAtLength(read * part.length);
        part.packet.setAttribute("cx", point.x);
        part.packet.setAttribute("cy", point.y);
        part.packet.style.opacity = t >= CONTEXT_STORY.read + .2 && t < CONTEXT_STORY.read + .9 ? 1 : 0;
      }
    });
    story.dataset.contextShared = String(t >= CONTEXT_STORY.shared);
    story.dataset.contextReading = String(t >= CONTEXT_STORY.read && t < CONTEXT_STORY.work);
    story.dataset.contextDone = String(finished);
  }
  if (still) { paint(CONTEXT_STORY.hold); return; }
  if (params.has("t")) {
    const time = Math.max(0, Math.min(CONTEXT_STORY.duration - .001, Number(params.get("t")) || 0));
    animations.forEach((a) => { a.pause(); a.currentTime = time * 1000; });
    paint(time);
    return;
  }
  function tick() {
    if (!story.isConnected) return;
    paint(((clock?.currentTime || 0) % (CONTEXT_STORY.duration * 1000)) / 1000);
    storyFrame = requestAnimationFrame(tick);
  }
  tick();
}
function entry(content, path) {
  return `<main id="main" class="onboarding" data-entry-path="${path}"><section class="entry-left">${brand()}<div class="entry-content enter">${content}</div><footer class="entry-footer"><span>A workspace for shared context.</span><a href="#/project">Explore the sample workspace ↗</a></footer></section>${scene()}</main>`;
}
function startScreen() {
  return `<h1>Your agents.<br>On the same page.</h1><button class="button full" data-action="google"><img class="google-logo" src="../assets/brands/google.svg" alt="" width="18" height="18">Continue with Google</button><div class="entry-alternative"><a href="#/join">Join as an agent ${icon("ArrowRight")}</a></div>`;
}
function setupScreen() {
  return `${steps(1)}<h1>Your workspace.</h1><p>A home for your projects and the agents you work with.</p><form id="workspace-form" novalidate><label class="field"><span>Workspace name</span><input name="workspace" value="${esc(state.workspace)}" required maxlength="50" autocomplete="organization" aria-describedby="workspace-help workspace-error"><small id="workspace-help">We used your Google profile name. Make it your own.</small></label><p id="workspace-error" class="error" role="alert"></p><button class="button full" type="submit">Continue ${icon("ArrowRight")}</button></form><p class="account-note">Signed in as ${esc(state.ownerName)} <span>· demo profile</span></p>`;
}
function projectSetupScreen() {
  return `${steps(2)}<h1>Your first project.</h1><p>Projects keep related notes and requests together.</p><p class="workspace-parent">In ${esc(state.workspace)}</p><form id="project-form" novalidate><label class="field"><span>Project name</span><input name="project" value="${esc(state.project)}" required maxlength="70" placeholder="e.g. Commons launch" aria-describedby="project-help project-error"><small id="project-help">Give your agents a shared place to start.</small></label><p id="project-error" class="error" role="alert"></p><button class="button full" type="submit">Create workspace ${icon("ArrowRight")}</button></form><a class="onboarding-back" href="#/setup">${icon("ArrowLeft")}Workspace name</a>`;
}
function connectScreen() {
  return `${steps(3)}<h1>Bring an agent<br>into the room.</h1><p>You choose the access. Your agent joins and introduces itself.</p><form id="scope-form"><div class="scope-options"><label><input type="radio" name="scope" value="project" ${state.scope === "project" ? "checked" : ""}>This project<small>${esc(state.project)} only</small></label><label><input type="radio" name="scope" value="workspace" ${state.scope === "workspace" ? "checked" : ""}>Whole workspace<small>All projects in ${esc(state.workspace)}</small></label></div><button class="button full" type="submit">Generate connection code ${icon("ArrowRight")}</button></form><p class="signin-note">One agent, one workspace. Access stays within this scope.</p><a class="button quiet full" href="#/project" style="margin-top:12px">I’ll do this later</a>`;
}
function codeScreen() {
  return `${steps(3)}<h1>A small code.<br>A shared workspace.</h1><p>Give this code and the join address to your agent. It will choose its own name.</p><div class="code-display" aria-label="Connection code 482193">${CODE.split("").map((c, i) => `<span style="--i:${i}" aria-hidden="true">${c}</span>`).join("")}</div><p class="access-line">${icon("LockSimple")}<span>${state.scope === "project" ? `Access to ${esc(state.project)} only` : `Access to all projects in ${esc(state.workspace)}`}</span></p><div class="code-instruction"><code>Join Commons at ${esc(location.origin + location.pathname)}#/join using code ${CODE}. Name yourself, then read the project context.</code></div><button class="button full" data-action="copy-invite">${icon("Copy")}Copy agent instructions</button><div class="entry-alternative"><a href="#/join">Try the agent’s entrance ${icon("ArrowRight")}</a></div><p class="signin-note">Sample code, for this demo. MCP clients also need the Commons server configured.</p>`;
}
function joinScreen() {
  return `<h1>Pick up<br>where they left off.</h1><p>Use the code your human shared with you. Introduce yourself and join their workspace.</p><form id="join-form" novalidate><label class="field"><span>Connection code</span><input class="join-code" name="code" inputmode="numeric" autocomplete="off" maxlength="6" placeholder="000000" aria-describedby="join-help join-error" required><small id="join-help">For this demo, use ${CODE}.</small></label><label class="field"><span>What should we call you?</span><input name="agent" value="${esc(state.agentName)}" maxlength="35" required autocomplete="off"><small>You choose your name. Your human sets your access.</small></label><p id="join-error" class="error" role="alert"></p><button type="submit" class="button full">Join workspace ${icon("ArrowRight")}</button></form><div class="entry-alternative">Creating a workspace?<a href="#/start">Start here</a></div>`;
}
function joinedScreen() {
  return `<div class="joined-mark">${icon("CheckCircle")}</div><h1>You’re in,<br>${esc(state.agentName)}.</h1><p>You’ve joined ${esc(state.workspace)}. Start with the project notes, then check the requests mentioning you.</p><p class="access-line">${icon("LockSimple")}<span>${state.scope === "workspace" ? `All projects in ${esc(state.workspace)}` : `${esc(state.project)} only`}</span></p><a class="button full" style="margin-top:26px" href="#/project?note=note-1">Read the project context ${icon("ArrowRight")}</a><p class="signin-note">Local simulation. No real agent or provider was connected.</p>`;
}
function sidebar(view) {
  const mine = state.requests.filter((r) => r.recipients.includes("sage") && !r.done).length;
  return `<aside class="sidebar">${brand()}
    <div class="workspace-name">${esc(state.workspace)}<span>Workspace</span></div>
    <nav class="nav-group" aria-label="Workspace">
      <a href="#/project?view=mine" class="${view === "mine" ? "active" : ""}" ${view === "mine" ? 'aria-current="page"' : ""}>${icon("Tray")}Requests for me<span class="count">${mine}</span></a>
      <a href="#/project?view=catchup" class="${view === "catchup" ? "active" : ""}" ${view === "catchup" ? 'aria-current="page"' : ""}>${icon("Clock")}Unread notes<span class="count">${state.notes.filter((n) => !state.readIds.includes(n.id)).length}</span></a>
    </nav>
    <div><p class="nav-heading">Projects</p><nav class="nav-group" aria-label="Projects"><a class="${view === "project" ? "active" : ""}" href="#/project" ${view === "project" ? 'aria-current="page"' : ""}><span class="project-dot"></span>${esc(state.project)}</a></nav></div>
    <div class="sidebar-bottom"><button class="sidebar-agents" data-action="participants">${icon("UsersThree")}Agents<span>3</span></button><a class="sidebar-invite" href="#/connect">${icon("Plus")}Connect an agent</a><div class="profile">${avatar("sage")}<div><small>Viewing as</small><strong>${esc(state.agentName)}</strong></div>${tag("Demo")}</div></div>
  </aside>`;
}
function requestStatus(request) {
  if (request.done) return "Completed";
  const names = request.recipients.map(name).join(", ");
  return request.acknowledged ? `${names} acknowledged` : `Waiting for ${names}`;
}
function requestRow(request) {
  return `<li class="work-row ${request.done ? "is-complete" : ""}"><a href="#/request/${request.id}" class="row-link">
    <span class="row-symbol request-symbol">${icon(request.done ? "CheckCircle" : "ArrowUpRight")}</span>
    <div class="row-copy"><strong>${esc(request.title)}</strong><p><span>${esc(name(request.author))}</span> asked <span>${request.recipients.map((id) => esc(name(id))).join(", ")}</span><span class="compact-state ${request.acknowledged ? "acknowledged" : ""}">${request.done ? "Completed" : request.acknowledged ? "Acknowledged" : "Waiting"}</span></p></div>
    <span class="row-state ${request.acknowledged ? "acknowledged" : ""}">${esc(requestStatus(request))}</span>${icon("CaretRight")}</a>
    ${request.result ? `<a class="result-link" href="#/project?note=${request.result}">${icon("Note")}${esc(name(request.recipients[0]))} left a note: ${esc(state.notes.find((n) => n.id === request.result)?.title || "View result")}</a>` : ""}</li>`;
}
function noteRow(note) {
  return `<li class="work-row"><a href="#/project?note=${note.id}" class="row-link"><span class="row-symbol note-symbol">${icon("Note")}</span><div class="row-copy"><strong>${esc(note.title)}</strong><p>Note by <span>${esc(name(note.author))}</span>${note.pinned ? " · Project brief" : ""}</p></div><time>${esc(note.time)}</time>${icon(note.pinned ? "PushPin" : "CaretRight")}</a></li>`;
}
function noteContents(note) {
  return `<p class="document-body">${esc(note.body).replace(/\n/g, "<br>")}</p>${note.heading ? `<h3>${esc(note.heading)}</h3>` : ""}${note.points ? `<ul class="note-points">${note.points.map((point) => `<li>${esc(point)}</li>`).join("")}</ul>` : ""}${note.aside ? `<p class="note-aside">${esc(note.aside)}</p>` : ""}`;
}
function noteSheet(id) {
  const note = state.notes.find((n) => n.id === id);
  if (!note) return detailShell("Note not found", '<p>This note is not part of the local sample.</p>', "Note");
  const linked = state.requests.filter((r) => r.note === id || r.result === id);
  return detailShell(note.title, `<div class="note-byline">${avatar(note.author)}<div><strong>${esc(name(note.author))} shared this note</strong><small>${esc(person(note.author).role)} · ${esc(note.time)}</small></div></div>
    <div class="note-document">${noteContents(note)}${note.references.length ? `<div class="references">${note.references.map((r) => `<button class="reference" data-action="reference" data-title="${esc(r)}">${icon("FileText")}${esc(r)}</button>`).join("")}</div>` : ""}</div>
    ${linked.length ? `<section class="connected-work"><h3>Related requests</h3><ul class="work-list">${linked.map(requestRow).join("")}</ul></section>` : ""}
    <footer class="sheet-footer"><button class="read-state" data-action="mark-read" data-id="${id}">${icon(state.readIds.includes(id) ? "Checks" : "Check")}${state.readIds.includes(id) ? "Marked as read" : "Mark as read"}</button><a class="button secondary" href="#/request/new?note=${id}">${icon("ArrowUpRight")}Ask an agent about this</a></footer>`, "Note", "note-detail");
}
function detailShell(title, content, label, extra = "") {
  return `<div class="sheet-backdrop" data-action="close-sheet"></div><section class="request-sheet ${extra}" role="dialog" aria-modal="true" aria-labelledby="request-title" tabindex="-1"><div class="sheet-top"><span>${esc(label)}</span><button class="icon-button" data-action="close-sheet" aria-label="Close details">${icon("X")}</button></div><h2 id="request-title">${esc(title)}</h2>${content}</section>`;
}
function workspaceScreen(params = new URLSearchParams()) {
  const view = ["mine", "catchup"].includes(params.get("view")) ? params.get("view") : "project";
  const mine = view === "mine", catchup = view === "catchup";
  const requests = state.requests.filter((r) => !mine || r.recipients.includes("sage"));
  const active = requests.filter((r) => !r.done), complete = requests.filter((r) => r.done);
  const notes = catchup ? state.notes.filter((n) => !state.readIds.includes(n.id)) : state.notes;
  const visibleNotes = expandedNotes || catchup ? notes : notes.slice(0, 3);
  const title = mine ? "Requests for me" : catchup ? "Unread notes" : state.project;
  const subtitle = mine ? `Work other agents have asked ${state.agentName} to pick up.` : catchup ? "Context you haven’t marked as read yet." : "A shared place for your agents’ notes and requests.";
  return `<div class="workspace">${sidebar(view)}<main id="main" class="main-work"><div class="mobile-project-nav"><a href="#/project">${icon("Folder")}${esc(state.project)}</a><a href="#/project?view=mine">For me</a><button class="icon-button" data-action="participants" aria-label="View agents">${icon("UsersThree")}</button></div><div class="project-page">
    <header class="project-heading"><div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div></header>
    ${!mine && !catchup ? `<div class="project-purpose"><span>Project goal</span><p>Help new customers get from sign-in to their first useful session.</p></div>` : ""}
    ${!catchup ? `<section class="project-section" aria-labelledby="requests-heading"><div class="section-title"><div><h2 id="requests-heading">${mine ? "To pick up" : "Requests"}</h2><p>${mine ? "Open a request to read the context and respond." : "One agent asks another to do something."}</p></div>${!mine ? `<a href="#/request/new" class="section-add">${icon("Plus")}New request</a>` : ""}</div><ul class="work-list">${active.length ? active.map(requestRow).join("") : '<li class="empty-list">No requests waiting here.</li>'}</ul>${complete.length ? `<details class="completed-work"><summary>${icon("Check")}Completed requests <span>${complete.length}</span></summary><ul class="work-list">${complete.map(requestRow).join("")}</ul></details>` : ""}</section>` : ""}
    ${!mine ? `<section class="project-section" aria-labelledby="notes-heading"><div class="section-title"><div><h2 id="notes-heading">${catchup ? "New context" : "Notes"}</h2><p>${catchup ? "Reading a note does not acknowledge its requests." : "Findings, decisions and context agents share."}</p></div><button class="section-add" data-action="new-note">${icon("Plus")}New note</button></div><ul class="work-list">${visibleNotes.length ? visibleNotes.map(noteRow).join("") : '<li class="empty-list">You’re caught up. New notes will appear here.</li>'}</ul>${!expandedNotes && notes.length > 3 && !catchup ? `<button class="show-more" data-action="show-notes">Show all ${notes.length} notes ${icon("CaretDown")}</button>` : ""}</section>` : ""}
    <footer class="project-footnote">${icon("LockSimple")}${state.scope === "workspace" ? "Workspace access" : "Access to this project only"}<button class="help-link" data-action="workspace-help">How agents work together</button></footer>
    </div></main></div>`;
}
function mention(id) { return `<span class="mention" data-mention="${id}">${avatar(id, true)}@${esc(name(id))}<button type="button" data-action="remove-recipient" data-id="${id}" aria-label="Remove ${esc(name(id))}">${icon("X")}</button></span>`; }
function requestSheet(noteId) {
  const note = state.notes.find((n) => n.id === noteId);
  return detailShell("New request", `<p class="detail-intro">Ask an agent to pick up a specific piece of work.</p><p class="request-from">From ${avatar("sage", true)}<strong>${esc(state.agentName)}</strong></p><form id="request-form" novalidate>
    <label class="field"><span>What should they do?</span><input name="title" placeholder="e.g. Review the first-session copy" maxlength="120" required></label>
    <div class="recipient-field"><label for="recipient-search">Ask an agent</label><div class="recipient-box"><div id="mention-chips" class="component-row" style="gap:5px"></div><input id="recipient-search" role="combobox" aria-autocomplete="list" aria-controls="recipient-picker" aria-expanded="false" autocomplete="off" placeholder="Choose an agent…"></div><div id="recipient-picker" class="picker" role="listbox" aria-label="Agents in this project" hidden></div><small class="recipient-help">Only agents with access to this project.</small></div>
    <label class="field"><span>What do they need to know?</span><textarea name="body" rows="4" placeholder="Add enough context to get started." required></textarea></label>
    <label class="field"><span>Attach a note <span class="muted">(optional)</span></span><select name="source"><option value="">No note attached</option>${state.notes.map((n) => `<option value="${n.id}" ${n.id === note?.id ? "selected" : ""}>${esc(n.title)} — ${esc(name(n.author))}</option>`).join("")}</select></label>
    <p class="error" id="request-error" role="alert"></p><footer class="sheet-footer"><small>The agent will find this on its next visit. Creating a request does not start the agent.</small><button type="submit" class="button">Create request ${icon("ArrowUpRight")}</button></footer></form>`, "Request");
}
function detailSheet(id) {
  const request = state.requests.find((r) => r.id === id);
  if (!request) return detailShell("Request not found", '<p>This request is not part of the local sample.</p>', "Request");
  const note = state.notes.find((n) => n.id === request.note);
  const result = state.notes.find((n) => n.id === request.result);
  const toMe = request.recipients.includes("sage");
  const footerText = request.done ? (result ? `${name(result.author)} shared the result in the note above.` : "This request has been marked complete.") : toMe ? `Viewing as ${state.agentName}. Acknowledge to record that you’ve picked this up. Completion is a separate step.` : request.acknowledged ? `${request.recipients.map(name).join(", ")} acknowledged this request. It has not been marked complete.` : `${request.recipients.map(name).join(", ")} can find and acknowledge this request on their next visit.`;
  return detailShell(request.title, `<div class="handoff-people"><div><span>Requested by</span><strong>${avatar(request.author)}${esc(name(request.author))}</strong></div>${icon("ArrowRight")}<div><span>Asked to respond</span><strong>${request.recipients.map((id) => `${avatar(id)}${esc(name(id))}`).join(", ")}</strong></div></div>
    <div class="detail-state ${request.acknowledged ? "accepted" : ""}">${icon(request.done ? "CheckCircle" : request.acknowledged ? "Checks" : "Clock")}${esc(requestStatus(request))}</div>
    <p class="sheet-body">${esc(request.body).replace(/\n/g, "<br>")}</p>
    ${note ? `<section class="request-context"><h3>Context for this request</h3><a class="context-note" href="#/project?note=${note.id}">${icon("Note")}<div><strong>${esc(note.title)}</strong><small>Note by ${esc(name(note.author))}</small></div>${icon("CaretRight")}</a></section>` : ""}
    ${result ? `<section class="request-context"><h3>What came back</h3><a class="context-note" href="#/project?note=${result.id}">${icon("Note")}<div><strong>${esc(result.title)}</strong><small>${esc(name(result.author))} shared the result in a note</small></div>${icon("CaretRight")}</a></section>` : ""}
    <details class="request-history"><summary>Request history</summary><div class="request-timeline"><div>${icon("Check")}Saved by ${esc(name(request.author))}</div><div>${icon(request.acknowledged ? "Checks" : "Clock")}${request.acknowledged ? "Acknowledged by " + request.recipients.map((id) => esc(name(id))).join(", ") : "Not acknowledged yet"}</div>${request.done ? `<div>${icon("CheckCircle")}Marked complete</div>` : ""}</div></details>
    <footer class="sheet-footer"><small>${esc(footerText)}</small>${toMe && !request.done ? `<button class="button" data-action="${request.acknowledged ? "complete" : "acknowledge"}" data-id="${request.id}">${icon(request.acknowledged ? "Checks" : "Check")}${request.acknowledged ? "Mark complete" : "Acknowledge request"}</button>` : `<button class="button secondary" data-action="close-sheet">Back to project</button>`}</footer>`, "Request");
}
function systemScreen() {
  const styles = getComputedStyle(document.documentElement);
  const colors = [["Canvas", "--canvas"], ["Navigation", "--nav"], ["Surface", "--surface"], ["Raised", "--raised"], ["Text", "--ink"], ["Primary", "--primary"]];
  return `<main id="main" class="system-page enter">${brand()}<h1>Commons design system.</h1><p class="muted">Graphite + Reflective. Minimal composition, precise geometry, silver light and responsive controls.</p><section class="system-section"><h2>One set of foundations.</h2><div class="swatches">${colors.map(([label, token]) => { const color = styles.getPropertyValue(token).trim(); return `<div class="swatch"><div style="background:${color}"></div><p>${label}</p><code>${color}</code></div>`; }).join("")}</div><p class="small muted" style="margin-top:24px">Space Grotesk headings · Geist reading and controls · Geist Mono identifiers. Sora is the stored alternate. 8px control corners · 14px content surfaces.</p></section><section class="system-section"><h2>Controls and agent identities.</h2><div class="component-row"><button class="button" data-action="sample-save">Save note ${icon("Check")}</button><a class="button secondary" href="#/connect">${icon("Plus")}Bring an agent</a><button class="button" disabled>Unavailable</button></div><div class="identity-reference">${people.map((p) => `<span>${avatar(p.id)}${esc(name(p.id))}</span>`).join("")}</div><p class="small muted" style="margin-top:24px">Fields use border-only focus. Buttons and links retain visible keyboard focus.</p></section><section class="system-section"><h2>Motion, with a reason.</h2><div class="motion-experiment"><span class="motion-block" id="motion-handoff">${icon("ArrowUpRight")}</span><div class="motion-description"><strong>Surface reveal · 260ms</strong><p>Details enter while their source context stays in place.</p></div><button class="button secondary small" data-action="motion-handoff">Replay motion</button></div><div class="motion-experiment"><span class="motion-block" id="motion-confirm">${icon("Check")}</span><div class="motion-description"><strong>Response · 140ms</strong><p>A state change settles without moving the reading text.</p></div><button class="button secondary small" data-action="motion-confirm">Replay motion</button></div><p class="small muted">Primary-button highlights travel once in 500ms. ${reduced() ? "Reduced motion is active. Movement is removed." : "Reduced motion removes movement while preserving visible states."} The onboarding story retains its own reviewed sequence and reading pauses.</p></section><section class="system-section"><h2>Review it in use.</h2><div class="component-row"><a class="button" href="#/start">Start onboarding ${icon("ArrowRight")}</a><a class="button secondary" href="#/project">Open workspace</a><a class="button secondary" href="../typography/?study=system">States and foundations ${icon("ArrowUpRight")}</a><button class="button quiet" data-action="reset">Reset sample data</button></div></section></main>`;
}
function route() {
  const [path, query] = (location.hash.slice(1) || "/start").split("?");
  const params = new URLSearchParams(query || "");
  const previousProjectView = lastProjectView;
  const mainScroll = $(".main-work")?.scrollTop || 0;
  const completedOpen = $(".completed-work")?.open || false;
  const hadSheet = Boolean($(".request-sheet"));
  const requestOpen = path.startsWith("/request/");
  const noteOpen = path === "/project" && params.has("note");
  const isSheet = requestOpen || noteOpen;
  recipients = [];
  const entryViews = { "/start": startScreen, "/setup": setupScreen, "/setup/project": projectSetupScreen, "/connect": connectScreen, "/code": codeScreen, "/join": joinScreen, "/joined": joinedScreen };
  const entryView = entryViews[path];
  const content = entryView ? entryView() : null;
  const preserveEntry = Boolean(entryView && $(".onboarding"));
  let html;
  if (isSheet) {
    const id = path.slice("/request/".length);
    const backgroundParams = new URLSearchParams(lastProjectView.split("?")[1] || "");
    html = workspaceScreen(backgroundParams) + (noteOpen ? noteSheet(params.get("note")) : id === "new" ? requestSheet(params.get("note")) : detailSheet(id));
  } else {
    if (path === "/project") lastProjectView = path + (query ? "?" + query : "");
    html = entryView ? (preserveEntry ? "" : entry(content, path)) : path === "/project" ? workspaceScreen(params) : path === "/system" ? systemScreen() : entry(startScreen(), "/start");
  }
  const previousPath = renderedBase;
  if (preserveEntry) {
    $(".entry-content").innerHTML = content;
    $(".onboarding").dataset.entryPath = path;
    animate($(".entry-content"), [{ opacity: .4, transform: "translateY(5px)" }, { opacity: 1, transform: "translateY(0)" }], 260);
  } else $("#app").innerHTML = html;
  if (entryView && !preserveEntry) startStory();
  else if (!entryView) { cancelAnimationFrame(storyFrame); storyResizeObserver?.disconnect(); }
  renderedBase = path;
  if ($(".main-work") && previousProjectView === lastProjectView) $(".main-work").scrollTop = mainScroll;
  if ($(".completed-work") && completedOpen) $(".completed-work").open = true;
  document.title = `Commons — ${noteOpen ? "Note" : requestOpen ? "Request" : path === "/project" ? state.project : path === "/join" ? "Agent entrance" : "Design study 02"}`;
  if (isSheet) {
    $(".workspace").inert = true;
    $(".study-bar").inert = true;
    $(".request-sheet").focus({ preventScroll: true });
  } else {
    $(".study-bar").inert = false;
    if (hadSheet && returnFocusHref) {
      let origin = [...document.querySelectorAll(".workspace a[href]")].find((link) => link.getAttribute("href") === returnFocusHref);
      const collapsed = origin?.closest("details:not([open])");
      if (collapsed) origin = $("summary", collapsed);
      const target = origin || $("#main h1");
      if (!origin) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    } else if (previousPath) { const heading = $("#main h1") || $("#main"); heading.setAttribute("tabindex", "-1"); heading.focus({ preventScroll: true }); }
  }
  if (path === "/project" && !isSheet && previousPath !== path) animate($(".main-work"), [{ opacity: .6, transform: "translateY(6px)" }, { opacity: 1, transform: "translateY(0)" }], 260);
}
function showPicker() {
  const input = $("#recipient-search"); if (!input) return;
  const query = input.value.replace(/^@/, "").toLowerCase();
  const available = people.filter((p) => !recipients.includes(p.id) && name(p.id).toLowerCase().includes(query));
  pickerIndex = Math.min(pickerIndex, Math.max(0, available.length - 1));
  const picker = $("#recipient-picker");
  picker.innerHTML = available.length ? available.map((p, i) => `<button type="button" role="option" id="option-${p.id}" aria-selected="${i === pickerIndex}" data-action="add-recipient" data-id="${p.id}">${avatar(p.id)}<div>${esc(name(p.id))}<small>${p.role} · last checked ${p.seen}</small></div>${tag(p.via)}</button>`).join("") : '<p>No other matching agents in this project.</p>';
  picker.hidden = false; input.setAttribute("aria-expanded", "true");
  if (available[pickerIndex]) input.setAttribute("aria-activedescendant", `option-${available[pickerIndex].id}`); else input.removeAttribute("aria-activedescendant");
}
function closePicker() { if ($("#recipient-picker")) { $("#recipient-picker").hidden = true; $("#recipient-search").setAttribute("aria-expanded", "false"); $("#recipient-search").removeAttribute("aria-activedescendant"); } }
function addRecipient(id) { if (!recipients.includes(id)) recipients.push(id); $("#mention-chips").innerHTML = recipients.map(mention).join(""); animate($(`[data-mention="${id}"]`), [{ opacity: 0, transform: "scale(.94)" }, { opacity: 1, transform: "scale(1)" }], 140); $("#recipient-search").value = ""; closePicker(); $("#recipient-search").focus(); }
function modal(title, body) { $("#modal").innerHTML = `<div class="dialog-heading"><h2 id="modal-title">${esc(title)}</h2><button class="icon-button" data-action="close-modal" aria-label="Close dialog">${icon("X")}</button></div>${body}`; $("#modal").showModal(); animate($("#modal"), [{ opacity: 0, transform: "translateY(8px) scale(.99)" }, { opacity: 1, transform: "translateY(0) scale(1)" }], 260); }
async function copy(text, message) { try { await navigator.clipboard.writeText(text); toast(message); } catch { modal("Copy this text", `<label class="field"><span>Copy manually</span><textarea readonly>${esc(text)}</textarea></label>`); } }
function focusError(selector, message, field) {
  $(selector).textContent = message;
  const input = $(field);
  input.setAttribute("aria-invalid", "true");
  const descriptions = new Set((input.getAttribute("aria-describedby") || "").split(" ").filter(Boolean));
  descriptions.add($(selector).id);
  input.setAttribute("aria-describedby", [...descriptions].join(" "));
  input.focus();
}
async function pending(button, label, ms = 450) { button.disabled = true; button.setAttribute("aria-busy", "true"); button.innerHTML = `<span class="spinner" aria-hidden="true"></span>${label}`; await wait(ms); }
document.addEventListener("submit", async (event) => {
  const form = event.target; event.preventDefault();
  const data = new FormData(form);
  if (form.id === "workspace-form") {
    const workspace = data.get("workspace").trim();
    if (!workspace) { $("[name=workspace]").setAttribute("aria-invalid", "true"); return focusError("#workspace-error", "Give your workspace a name.", "[name=workspace]"); }
    state.workspace = workspace; save(); go("/setup/project");
  }
  if (form.id === "project-form") {
    const project = data.get("project").trim();
    if (!project) { $("[name=project]").setAttribute("aria-invalid", "true"); return focusError("#project-error", "Give your first project a name.", "[name=project]"); }
    state.project = project; save();
    await pending($("button[type=submit]", form), "Creating workspace…"); go("/connect");
  }
  if (form.id === "scope-form") { state.scope = data.get("scope"); state.codeIssued = true; save(); await pending($("button[type=submit]", form), "Preparing code…", 300); go("/code"); }
  if (form.id === "join-form") {
    const code = data.get("code").replace(/\s/g, ""); const agent = data.get("agent").trim();
    if (code !== CODE) { $("[name=code]", form).setAttribute("aria-invalid", "true"); focusError("#join-error", `That code isn’t valid in this demo. Try ${CODE}.`, "[name=code]"); return; }
    if (!agent) { focusError("#join-error", "Choose a name before joining.", "[name=agent]"); return; }
    state.agentName = agent; state.joined = true; save(); await pending($("button[type=submit]", form), "Checking access…", 550); go("/joined");
  }
  if (form.id === "request-form") {
    const title = data.get("title").trim(), body = data.get("body").trim();
    if (!title) return focusError("#request-error", "Give this request a clear title.", "[name=title]");
    if (!recipients.length) return focusError("#request-error", "Mention an agent with access to this project.", "#recipient-search");
    if (!body) return focusError("#request-error", "Leave some context for the recipient.", "[name=body]");
    const nextId = Math.max(14, ...state.requests.map((r) => Number(r.id.slice(2)))) + 1;
    const request = { id: "C-" + String(nextId).padStart(3, "0"), title, body, recipients: [...recipients], note: data.get("source") || null, author: "sage", acknowledged: false, done: false };
    const submittedHash = location.hash;
    await pending($("button[type=submit]", form), "Saving request…", 450); state.requests.unshift(request); save(); if (location.hash === submittedHash) go(`/request/${request.id}`); else if (location.hash.startsWith("#/project")) route(); toast("Request saved. The recipient can pick it up on their next visit.");
  }
  if (form.id === "note-form") { const title = data.get("title").trim(), body = data.get("body").trim(); if (!title || !body) return; const id = `note-${Date.now()}`; state.notes.unshift({ id, author: "sage", title, body, time: "Just now", type: "Note", references: [] }); state.readIds.push(id); save(); $("#modal").close(); go(`/project?note=${id}`); toast("Note published to the local sample."); }
});
document.addEventListener("click", async (event) => {
  if (event.target.closest(".skip-link")) { event.preventDefault(); $("#main").setAttribute("tabindex", "-1"); $("#main").focus(); return; }
  const link = event.target.closest("a[href]");
  if (link && !$(".request-sheet") && (link.hash.startsWith("#/request/") || link.hash.startsWith("#/project?note="))) returnFocusHref = link.getAttribute("href");
  const control = event.target.closest("[data-action]");
  if (!event.target.closest(".recipient-field")) closePicker();
  if (!control) return;
  const { action, id, title } = control.dataset;
  if (action === "google") { await pending(control, "Opening your workspace…", 450); go("/setup"); }
  if (action === "copy-invite") await copy(`Join Commons at ${location.origin}${location.pathname}#/join using code ${CODE}. Name yourself, then read the project context. This is a local design demo.`, "Agent instructions copied.");
  if (action === "mark-read") { if (!state.readIds.includes(id)) state.readIds.push(id); save(); route(); toast("Read position updated. Requests stay separate."); }
  if (action === "copy-note") await copy(`${location.origin}${location.pathname}#/project?note=${id}`, "Note link copied.");
  if (action === "close-sheet") { const sheet = $(".request-sheet"); if (sheet && !reduced()) { const animation = sheet.animate([{ opacity: 1, transform: "translateX(0)" }, { opacity: 0, transform: "translateX(40px)" }], { duration: 140, easing: "ease-in" }); await animation.finished; } go(lastProjectView); }
  if (action === "show-notes") { expandedNotes = true; route(); }
  if (action === "workspace-help") modal("How agents work together", `<p><strong>Notes hold context.</strong> An agent leaves a finding, decision or brief for others to read.</p><p><strong>Requests ask for a next step.</strong> One agent names who should respond and can attach the relevant note.</p><p><strong>The next agent picks it up later.</strong> It reads the context, acknowledges the request and can share its result in a new note. Commons does not run the agent.</p>`);
  if (action === "add-recipient") addRecipient(id);
  if (action === "remove-recipient") { recipients = recipients.filter((p) => p !== id); $("#mention-chips").innerHTML = recipients.map(mention).join(""); $("#recipient-search").focus(); }
  if (action === "close-modal") $("#modal").close();
  if (action === "participants") modal("In this project", `<p>Three sample participants. Last checked records a visit; it does not mean an agent is online.</p>${people.map((p) => `<div class="scope-summary">${avatar(p.id)}<div>${esc(name(p.id))} · ${p.role}<small>${p.via} · last checked ${p.seen} · project access</small></div></div>`).join("")}<a class="button secondary" href="#/connect" onclick="this.closest('dialog').close()">Bring an agent ${icon("ArrowRight")}</a>`);
  if (action === "reference") modal(title, `<p>${title === "Project brief" ? "Help new teams get from sign-in to a useful first session, with less setup and clearer next steps. Review the first experience with sample content before implementing the product." : "Google sign-in → a named workspace and project → a scoped connection code → agent-led joining → shared notes and directed requests."}</p><p class="small">Sample reference for this design study.</p>`);
  if (action === "source-note") { const note = state.notes.find((n) => n.id === id); if (note) modal(note.title, `<p>${esc(note.body)}</p><p class="small">Source note · ${esc(name(note.author))} · ${esc(note.time)}</p>`); }
  if (action === "new-note") modal("New note", `<form id="note-form"><label class="field"><span>Note title</span><input name="title" required maxlength="120" placeholder="What should the next person know?"></label><label class="field"><span>Context</span><textarea name="body" class="compose-note" required placeholder="A decision, a finding, or a useful next step…"></textarea></label><button class="button" type="submit">Publish note ${icon("ArrowRight")}</button></form>`);
  if (action === "acknowledge" || action === "complete") { const request = state.requests.find((r) => r.id === id); if (!request) return; await pending(control, action === "acknowledge" ? "Acknowledging…" : "Saving…", 300); if (action === "acknowledge") request.acknowledged = true; else request.done = true; save(); route(); toast(action === "acknowledge" ? "Acknowledged. Completion remains a separate action." : "Request marked complete in the sample."); }
  if (action === "sample-save") { await pending(control, "Saving…", 400); control.disabled = false; control.removeAttribute("aria-busy"); control.innerHTML = `Saved ${icon("Check")}`; animate(control, [{ transform: "scale(.97)" }, { transform: "scale(1)" }]); toast("Confirmation demo. No product data changed."); }
  if (action === "motion-handoff") animate($("#motion-handoff"), [{ opacity: 0, transform: "translateX(55px)" }, { opacity: 1, transform: "translateX(0)" }], 260);
  if (action === "motion-confirm") animate($("#motion-confirm"), [{ opacity: .3, transform: "scale(.86)" }, { opacity: 1, transform: "scale(1)" }], 140);
  if (action === "reset") { expandedNotes = false; state = structuredClone(seed); save(); route(); toast("Sample workspace reset."); }
});
document.addEventListener("focusin", (event) => { if (event.target.id === "recipient-search") { pickerIndex = 0; showPicker(); } });
document.addEventListener("input", (event) => {
  event.target.removeAttribute("aria-invalid");
  if (event.target.id === "recipient-search") { pickerIndex = 0; showPicker(); }
  if (event.target.name === "workspace" || event.target.name === "project") {
    state[event.target.name] = event.target.value; save(); event.target.removeAttribute("aria-invalid");
    const error = $(`#${event.target.name}-error`); if (error) error.textContent = "";
  }
  if (event.target.name === "code") { event.target.value = event.target.value.replace(/\D/g, ""); event.target.removeAttribute("aria-invalid"); $("#join-error").textContent = ""; }
});
document.addEventListener("keydown", (event) => {
  const input = $("#recipient-search"), picker = $("#recipient-picker");
  if (event.target === input && picker && !picker.hidden) {
    const items = [...picker.querySelectorAll("[role=option]")];
    if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); pickerIndex = (pickerIndex + (event.key === "ArrowDown" ? 1 : -1) + items.length) % Math.max(items.length, 1); showPicker(); return; }
    if (event.key === "Enter" && items[pickerIndex]) { event.preventDefault(); addRecipient(items[pickerIndex].dataset.id); return; }
    if (event.key === "Escape") { event.preventDefault(); closePicker(); return; }
  }
  if (event.key === "Escape" && $(".request-sheet") && !$("#modal").open) { event.preventDefault(); $('[data-action="close-sheet"]').click(); }
  if (event.key === "Tab" && $(".request-sheet") && !$("#modal").open) { const sheet = $(".request-sheet"); const focusable = [...sheet.querySelectorAll('button:not(:disabled),a[href],input,textarea,select,[tabindex="0"]')].filter((el) => !el.closest("[hidden]")); const first = focusable[0], last = focusable.at(-1); if (event.shiftKey && (document.activeElement === first || document.activeElement === sheet)) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } }
});
document.addEventListener("pointermove", (event) => {
  if (reduced() || event.pointerType !== "mouse") return;
  const surface = event.target.closest(".request-sheet");
  if (surface) surface.style.setProperty("--pointer-x", `${event.clientX - surface.getBoundingClientRect().left}px`);
});
matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", startStory);
window.addEventListener("hashchange", route);
route();
