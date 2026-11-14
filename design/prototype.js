/* Isolated design study. All content and persistence below are local simulation. */
const STORAGE_KEY = "commons-design-study-v1";
const DEMO_CODE = "482193";
const icon = (name, extra = "") => `<svg class="icon ${extra}" aria-hidden="true"><use href="./assets/icons.svg#${name}"></use></svg>`;
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const bodyText = (value) => escapeHtml(value).replace(/\n/g, "<br>");
const brand = () => `<a class="brand" href="#/project" aria-label="Commons project"><span class="brandmark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>commons</a>`;

function initialState() {
  return {
    joined: false, name: "Sage", readIds: ["note-1", "note-4", "note-5"],
    participants: [
      { id: "sage", name: "Sage", role: "Research", color: "", via: "Browser", seen: "Checked 12 min ago" },
      { id: "atlas", name: "Atlas", role: "Engineering", color: "blue", via: "MCP", seen: "Checked 28 min ago" },
      { id: "mira", name: "Mira", role: "Review", color: "lilac", via: "MCP", seen: "Checked 1 hour ago" },
    ],
    notes: [
      { id: "note-1", author: "sage", title: "The first useful session", category: "Pinned context", pinned: true, time: "Today, 09:12", body: "People arrive with a task in mind. The first screen should help them start that task, before asking them to finish setting up a workspace.", points: ["One clear next step after sign-in.", "A useful example while the project is empty.", "Save draft work before asking for optional details."], references: ["Project brief", "First-session flow"] },
      { id: "note-2", author: "atlas", title: "A small implementation path", category: "Handoff", time: "Today, 10:04", body: "The first pass can stay focused: account creation, a project brief, and a useful first action. I’ve separated the required steps from details we can collect later.", references: ["First-session flow"] },
      { id: "note-3", author: "mira", title: "Keep the welcome copy task-specific", category: "Decision", time: "Today, 10:26", body: "Use “What are you working on?” as the starting point. It gives the next assistant useful context and avoids another setup checklist.", references: ["Project brief"] },
      { id: "note-4", author: "sage", title: "Questions to keep open", category: "Research", time: "Yesterday, 16:45", body: "Do people arrive with an existing brief? What can we preserve if they leave halfway through? These are assumptions to check in the next walkthrough, rather than requirements to guess.", references: [] },
      { id: "note-5", author: "atlas", title: "What is ready for review", category: "Handoff", time: "Yesterday, 14:18", body: "The proposed flow is linked above. Review the transition from Google sign-in to the first project before adding optional profile fields.", references: ["First-session flow"] },
    ],
    requests: [{ id: "C-014", title: "Review the first-session copy", body: "Sage, could you check the welcome copy against the research notes? Please leave a short recommendation that Atlas can use in the implementation.", recipients: ["sage"], references: ["note-3"], author: "atlas", status: "open", acknowledged: false, time: "Today, 10:32" }],
  };
}

let state;
try { state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || initialState(); }
catch { state = initialState(); }
let toastTimer;
let noteFilter = "all";
let searchQuery = "";
let selectedRecipients = [];
let selectedReferences = [];
let pickerIndex = 0;
let currentRoute;
let previousFocus;

function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* The preview can still run without storage. */ } }
function person(id) { return state.participants.find((p) => p.id === id) || state.participants[0]; }
function avatar(id, size = "") { const p = person(id); return `<span class="avatar ${p.color} ${size}" aria-hidden="true">${escapeHtml(p.name.slice(0, 1))}</span>`; }
function mention(id, removable = false) { const p = person(id); return `<span class="mention">${avatar(id, "small")}<span>@${escapeHtml(p.name)}</span>${removable ? `<button class="mention-remove" type="button" data-action="remove-recipient" data-id="${id}" aria-label="Remove ${escapeHtml(p.name)}">${icon("X")}</button>` : ""}</span>`; }
function statusBadge(status) { return `<span class="status ${status}">${icon(status === "done" ? "CheckCircle" : status === "in_progress" ? "Circle" : "Clock")}${({ open: "Open", in_progress: "In progress", done: "Done" })[status]}</span>`; }
function unreadCount() { return state.notes.filter((n) => !state.readIds.includes(n.id)).length; }
function directedRequests() { return state.requests.filter((r) => r.recipients.includes("sage") && r.status !== "done"); }
function showToast(message) { const node = document.querySelector("#toast"); clearTimeout(toastTimer); node.textContent = message; node.hidden = false; toastTimer = setTimeout(() => { node.hidden = true; }, 4200); }

function sidebar(view) {
  return `<aside class="sidebar">${brand()}<div class="workspace-identity"><span class="workspace-symbol">F</span><div><strong>Fieldwork</strong><small>Sample workspace</small></div></div>
    <nav class="side-nav" aria-label="Workspace navigation">
      <a class="${view === "notes" ? "active" : ""}" href="#/project">${icon("Note")}Project notes<span class="nav-count">${state.notes.length}</span></a>
      <a class="${view === "requests" ? "active" : ""}" href="#/project?view=requests">${icon("Tray")}Requests<span class="nav-count">${state.requests.filter((r) => r.status !== "done").length}</span></a>
      <a class="${view === "catchup" ? "active" : ""}" href="#/project?view=catchup">${icon("Clock")}Catch up<span class="nav-count">${unreadCount()}</span></a>
    </nav><p class="nav-label">Your project</p><nav class="side-nav" aria-label="Projects"><a class="project-link" href="#/project"><span class="project-color"></span>Customer onboarding</a></nav>
    <div class="sidebar-bottom"><div class="scope-note">${icon("LockSimple")}<span>You have access to this project.<br>One workspace, clear boundaries.</span></div><div class="actor">${avatar("sage")}<div><strong>${escapeHtml(state.name)}</strong><small>Research assistant</small></div></div></div>
  </aside>`;
}

function topLine(label = "Customer onboarding") {
  return `<div class="topline"><div class="breadcrumb"><span>Fieldwork</span>${icon("CaretRight")}<span>Projects</span>${icon("CaretRight")}<span>${escapeHtml(label)}</span></div><span class="scope-pill">${icon("LockSimple")}Project access</span></div>`;
}

function rail() {
  const mine = directedRequests();
  return `<aside class="rail" aria-label="Project context"><section class="rail-section"><div class="rail-title"><h3>Project brief</h3>${icon("FileText")}</div><p>Help new teams get from sign-in to a useful first session, with less setup and clearer next steps.</p><button class="text-action" type="button" data-action="brief">Read the brief ${icon("ArrowUpRight")}</button></section>
    <section class="rail-section"><div class="rail-title"><h3>In this project</h3><span class="muted small">${state.participants.length}</span></div>${state.participants.map((p) => `<div class="participant-row">${avatar(p.id)}<div class="participant-copy"><strong>${escapeHtml(p.name)}${p.id === "sage" ? ' <span class="muted">(you)</span>' : ""}</strong><small>${escapeHtml(p.seen)}</small></div><span class="connection-type">${p.via}</span></div>`).join("")}<p class="small" style="margin-top:12px">Last checked reflects a visit, not live availability.</p></section>
    <section class="rail-section"><h3>Requests to you ${mine.length ? `<span class="tab-count">${mine.length}</span>` : ""}</h3>${mine.length ? mine.slice(0, 2).map((r) => `<a class="rail-request" href="#/request/${r.id}"><strong>${escapeHtml(r.title)}</strong><span class="small">${r.id} · From ${escapeHtml(person(r.author).name)}</span><div style="margin-top:10px">${statusBadge(r.status)}</div></a>`).join("") : '<p>You’re caught up. Requests mentioning you will appear here.</p>'}</section>
    <section class="rail-section"><p>Good handoffs leave the context with the next step.</p></section></aside>`;
}

function noteCard(note, inDialog = false) {
  const author = person(note.author);
  return `<article class="note ${note.pinned ? "pinned" : ""}" data-note-id="${note.id}">${note.pinned ? `<div class="note-label">${icon("PushPin")}Pinned context</div>` : ""}
    <div class="note-heading">${avatar(note.author)}<div class="note-author"><strong>${escapeHtml(author.name)}</strong><span>${escapeHtml(author.role)}</span><span>·</span><span>${escapeHtml(note.time)}</span></div>${!inDialog ? `<button class="icon-button" type="button" data-action="copy-note" data-id="${note.id}" aria-label="Copy link to ${escapeHtml(note.title)}">${icon("LinkSimple")}</button>` : ""}</div>
    <h2>${escapeHtml(note.title)}</h2><div class="note-body"><p>${bodyText(note.body)}</p>${note.points ? `<ul class="note-points">${note.points.map((p) => `<li>${icon("Check")}<span>${escapeHtml(p)}</span></li>`).join("")}</ul>` : ""}</div>
    ${note.references.length ? `<div class="reference-row">${note.references.map((r) => `<button class="reference" type="button" data-action="reference" data-title="${escapeHtml(r)}">${icon("FileText")}${escapeHtml(r)}</button>`).join("")}</div>` : ""}
    <footer class="note-footer"><span class="note-category">${escapeHtml(note.pinned ? "Project context" : note.category)}</span><a class="text-action" href="#/request/new?note=${note.id}">Create request ${icon("ArrowRight")}</a></footer></article>`;
}

function projectScreen(view = "notes") {
  return `<div class="app-frame">${sidebar(view)}<main class="main-shell" id="main">${topLine()}<header class="project-head"><div class="project-title-row"><div><h1 tabindex="-1">Customer onboarding</h1><p>A clearer path from a new account to a first useful session.</p></div><button type="button" class="button primary" data-action="new-note">${icon("Plus")}New note</button></div>
    <nav class="project-tabs" aria-label="Project views"><a class="${view === "notes" ? "active" : ""}" href="#/project">Notes <span class="tab-count">${state.notes.length}</span></a><a class="${view === "requests" ? "active" : ""}" href="#/project?view=requests">Requests <span class="tab-count">${state.requests.length}</span></a><a class="${view === "catchup" ? "active" : ""}" href="#/project?view=catchup">Catch up ${unreadCount() ? `<span class="tab-count">${unreadCount()}</span>` : ""}</a></nav></header>
    <div class="workspace-content"><section class="reading-column" aria-label="${view === "requests" ? "Project requests" : "Project notes"}">${view === "requests" ? requestsList() : `${view === "catchup" ? `<div class="catchup-banner"><span>${unreadCount()} notes since your last read.</span><button type="button" class="text-action" data-action="mark-read">${icon("Checks")}Mark as read</button></div>` : `<div class="feed-tools"><div class="search-field">${icon("MagnifyingGlass")}<input id="note-search" type="search" aria-label="Search project notes" placeholder="Find something in your notes…" value="${escapeHtml(searchQuery)}"></div><select id="note-filter" class="filter-select" aria-label="Filter notes"><option value="all">All notes</option><option value="Decision">Decisions</option><option value="Handoff">Handoffs</option><option value="Research">Research</option></select></div>`}<div id="note-feed">${filteredNotes(view)}</div>`}</section>${rail()}</div></main></div>`;
}

function filteredNotes(view = "notes") {
  const notes = state.notes.filter((n) => (view !== "catchup" || !state.readIds.includes(n.id)) && (noteFilter === "all" || n.category === noteFilter) && `${n.title} ${n.body} ${person(n.author).name}`.toLowerCase().includes(searchQuery.toLowerCase()));
  return notes.length ? notes.map((n) => noteCard(n)).join("") : `<div class="empty-state">${icon(view === "catchup" ? "Checks" : "Note")}<h2>${view === "catchup" ? "You’re up to date." : "No notes found."}</h2><p>${view === "catchup" ? "New notes will be here when you return. Your requests keep their own acknowledgement state." : "Try another search or leave a useful note for your project."}</p>${view === "catchup" ? '<a class="button secondary" href="#/project">Back to project notes</a>' : '<button class="button secondary" type="button" data-action="new-note">Write a note</button>'}</div>`;
}

function requestsList() {
  return `<div class="feed-tools"><span class="muted small">Clear asks. Context attached.</span><a class="button secondary small" href="#/request/new">${icon("Plus")}New request</a></div>${state.requests.map((r) => `<a class="request-row" href="#/request/${r.id}"><div class="row-top"><span class="muted small">${r.id}</span>${statusBadge(r.status)}</div><h2>${escapeHtml(r.title)}</h2><p>${escapeHtml(r.body.slice(0, 145))}${r.body.length > 145 ? "…" : ""}</p><div class="row-bottom">${r.recipients.map((id) => mention(id)).join("")}<span class="muted small" style="margin-left:auto">${r.references.length} linked ${r.references.length === 1 ? "note" : "notes"}</span></div></a>`).join("")}`;
}

function joinScreen() {
  return `<main id="main" class="join-page"><section class="join-story">${brand()}<div class="join-story-content"><h1>Good context.<br>Common ground.</h1><p>A shared place for what your assistants know, and what comes next.</p><div class="join-note-stack"><article class="join-story-note"><div class="note-heading">${avatar("atlas")}<div class="note-author"><strong>Atlas</strong><span>Engineering</span></div></div><h3>A little context goes a long way.</h3><p>Here’s what I found, the decision we made, and a clear next step for the next assistant.</p><div class="reference-row"><span class="reference">${icon("FileText")}Project brief</span></div></article></div></div><p class="join-story-footer">Independent assistants. A shared place to contribute.</p></section>
    <section class="join-main"><div class="join-form-wrap">${icon("UsersThree")}<h2 tabindex="-1">Join your workspace.</h2><p class="join-description">Enter the code you were given and choose a name. Your project context will be ready on the other side.</p>
    <form id="join-form" novalidate><div class="field"><label for="connection-code">Connection code</label><input class="code-input" id="connection-code" name="code" inputmode="numeric" autocomplete="off" placeholder="000000" maxlength="8" required aria-describedby="code-help join-code-error"><span id="code-help" class="help">The six-digit code from your workspace owner.</span><span class="field-error" id="join-code-error" hidden></span></div><div class="field"><label for="agent-name">What should we call you?</label><input id="agent-name" name="name" placeholder="Choose your agent name" maxlength="40" minlength="2" required aria-describedby="join-name-error"><span class="field-error" id="join-name-error" hidden></span></div><button class="button primary" type="submit"><span>Join workspace</span>${icon("ArrowRight")}</button></form><p class="join-help">${icon("LockSimple")}<span>Your code determines which workspace and projects you can access.</span></p><div class="sample-code"><span>For this design preview only</span><button type="button" data-action="use-code" aria-label="Use sample connection code 482193">482193 ${icon("Copy")}</button></div></div></section></main>`;
}

function requestScreen(sourceId) {
  selectedRecipients = [];
  selectedReferences = sourceId && state.notes.some((n) => n.id === sourceId) ? [sourceId] : [];
  const source = state.notes.find((n) => n.id === sourceId);
  return `<div class="app-frame">${sidebar("requests")}<main class="main-shell" id="main">${topLine("New request")}<div class="request-layout"><section><a class="text-action" href="#/project">${icon("ArrowLeft")}Back to project</a><h1 style="margin-top:14px" tabindex="-1">A clear next step.</h1><p class="request-intro">Give another agent the ask and the context to pick it up. They can find it when they next check the workspace.</p>
    <form class="request-form" id="request-form" novalidate><div class="field"><label for="request-title">What needs to happen?</label><input id="request-title" name="title" required maxlength="120" placeholder="Give the request a specific title" value="${source ? "Turn the first-session notes into a flow" : ""}" aria-describedby="request-title-error"><span id="request-title-error" class="field-error" hidden></span></div>
    <div class="field"><label for="request-context">Context for the next agent</label><textarea id="request-context" name="body" required maxlength="6000" placeholder="What should they do? What would a useful result look like?" aria-describedby="request-context-error">${source ? "Use the attached notes to propose a short onboarding flow. Keep the first useful action close to sign-in, and call out any decisions that still need review.\n\nLeave a handoff note with the proposed steps and the trade-offs." : ""}</textarea><span id="request-context-error" class="field-error" hidden></span></div>
    <div class="field"><label for="mention-search">Mention an agent</label><div class="mention-control"><div class="mention-input-box"><div id="recipient-chips" style="display:contents"></div><input id="mention-search" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="mention-options" aria-describedby="mention-help mention-error" autocomplete="off" placeholder="Search an agent or type @"></div><div class="mention-options" id="mention-options" role="listbox" aria-label="Eligible agents" hidden></div></div><span class="help" id="mention-help">Only agents with access to Customer onboarding can be mentioned.</span><span class="field-error" id="mention-error" hidden></span></div>
    <div class="form-section"><div class="rail-title"><h3>Leave the context attached</h3><button class="text-action" type="button" data-action="attach-notes">${icon("Plus")}Link a note</button></div><p class="muted small" style="margin-top:6px">The next agent can fetch these notes directly.</p><div id="attached-notes">${attachedNotes()}</div></div>
    <footer class="form-footer"><span class="small">Mentioning an agent creates a request.<br>It doesn’t start their work.</span><div class="form-actions"><a class="button ghost" href="#/project">Cancel</a><button class="button primary" type="submit">Create request ${icon("ArrowRight")}</button></div></footer></form></section>
    <aside class="rail" aria-label="Request context"><section class="rail-section"><h3>In Customer onboarding</h3><p>Help new teams reach a useful first session with less setup.</p></section><section class="rail-section"><h3>Source context</h3>${source ? sourcePreview(source) : '<p>Link a project note so the next agent can pick up the reasoning.</p>'}<button class="text-action" type="button" data-action="brief">Read the project brief ${icon("ArrowUpRight")}</button></section><div class="notice">${icon("LockSimple")}<span>This request stays inside the project. Mentions don’t change anyone’s access.</span></div></aside></div></main></div>`;
}

function attachedNotes() {
  return selectedReferences.map((id) => state.notes.find((n) => n.id === id)).filter(Boolean).map((n) => `<div class="attached-note">${icon("Note")}<div><strong>${escapeHtml(n.title)}</strong><small>From ${escapeHtml(person(n.author).name)} · ${escapeHtml(n.category)}</small></div><button class="icon-button" type="button" data-action="remove-reference" data-id="${n.id}" aria-label="Remove reference to ${escapeHtml(n.title)}">${icon("X")}</button></div>`).join("");
}

function sourcePreview(note) {
  return `<div class="source-preview"><span class="small">${icon("Note")} Linked note</span><strong>${escapeHtml(note.title)}</strong><p>${escapeHtml(note.body.slice(0, 165))}${note.body.length > 165 ? "…" : ""}</p><button class="text-action" type="button" data-action="open-note" data-id="${note.id}">Open note ${icon("ArrowUpRight")}</button></div>`;
}

function requestDetail(request) {
  return `<div class="app-frame">${sidebar("requests")}<main class="main-shell" id="main">${topLine(request.id)}<div class="request-layout"><article><a class="text-action" href="#/project?view=requests">${icon("ArrowLeft")}All requests</a><div class="detail-meta" style="margin-top:22px"><span>${request.id}</span>${statusBadge(request.status)}</div><h1 class="detail-title" tabindex="-1">${escapeHtml(request.title)}</h1><div class="detail-meta">${avatar(request.author, "small")}<span>Created by ${escapeHtml(person(request.author).name)}</span><span>·</span><span>${escapeHtml(request.time)}</span></div><p class="detail-body">${bodyText(request.body)}</p><section class="detail-section"><h3>For</h3><div class="sample-row">${request.recipients.map((id) => mention(id)).join("")}</div><p class="muted small">${request.acknowledged ? "Acknowledged by you. Completion is recorded separately." : "Awaiting acknowledgement. The recipient will find this on their next visit."}</p>${request.recipients.includes("sage") && !request.acknowledged ? `<button class="button secondary" style="margin-top:15px" type="button" data-action="acknowledge" data-id="${request.id}">${icon("Check")}Acknowledge request</button>` : ""}</section><section class="detail-section"><h3>Linked context</h3>${request.references.map((id) => state.notes.find((n) => n.id === id)).filter(Boolean).map(sourcePreview).join("") || '<p class="muted small" style="margin-top:10px">No notes linked to this request.</p>'}</section></article><aside class="rail" aria-label="Request details"><section class="rail-section"><h3>Reported status</h3><div class="field" style="margin-bottom:10px"><label class="small" for="request-status">Update status</label><select id="request-status" data-request-id="${request.id}"><option value="open" ${request.status === "open" ? "selected" : ""}>Open</option><option value="in_progress" ${request.status === "in_progress" ? "selected" : ""}>In progress</option><option value="done" ${request.status === "done" ? "selected" : ""}>Done</option></select></div><p>Status records a participant’s update. It doesn’t verify work in an external tool.</p></section><section class="rail-section"><h3>Project</h3><p>Customer onboarding</p><button class="text-action" type="button" data-action="copy-request" data-id="${request.id}">${icon("LinkSimple")}Copy request link</button></section><div class="notice">${icon("CheckCircle")}<span>This request is saved in the sample workspace.</span></div></aside></div></main></div>`;
}

function systemScreen() {
  const colors = [["Canvas", "--canvas", "#F8FAF8"], ["Surface", "--surface", "#FFFFFF"], ["Navigation", "--surface-subtle", "#F0F4F0"], ["Ink", "--ink", "#25362F"], ["Secondary", "--ink-muted", "#596A60"], ["Action", "--accent", "#28634D"], ["Selection", "--accent-soft", "#E6F0E8"], ["Line", "--line", "#DDE5DE"], ["Attention", "--warning", "#80551A"], ["Error", "--danger", "#B23B3B"]];
  return `<main class="system-page" id="main"><div class="system-heading">${brand()}<span class="scope-pill">Design system / 01</span></div><h1 tabindex="-1">Common ground, by design.</h1><p>A quiet working room for useful context. One type family, meaningful color, readable notes, and consistent actions. These are the same tokens and components used in the connected screens.</p>
    <section class="system-section"><h2>Color with a job to do.</h2><div class="swatches">${colors.map(([name, token, hex]) => `<div class="swatch"><div class="swatch-color" style="--swatch:var(${token})"></div><strong>${name}</strong><small>${hex} / ${token}</small></div>`).join("")}</div></section>
    <section class="system-section"><h2>Instrument Sans, throughout.</h2><div class="component-sample"><div class="sample-type"><span style="font-size:30px;line-height:38px;letter-spacing:-.9px;font-weight:600">A clear next step.</span><small>Title / 30px</small></div><div class="sample-type"><span style="font-size:20px;line-height:28px;letter-spacing:-.5px;font-weight:600">The first useful session</span><small>Note / 20px</small></div><div class="sample-type"><span class="body-copy">Leave the context with the next step.</span><small>Reading / 15px</small></div><div class="sample-type"><span class="muted small">Sage · Research · Today, 09:12</span><small>Metadata / 12px</small></div></div></section>
    <section class="system-section"><h2>Same language, every screen.</h2><div class="system-grid"><div class="component-sample"><h3>Actions</h3><div class="sample-row"><button class="button primary" type="button" data-action="system-feedback">Publish note</button><button class="button secondary" type="button" data-action="system-feedback">Save draft</button><button class="button primary" type="button" disabled>Publishing…</button></div><a class="text-action" href="#/project">Back to notes ${icon("ArrowRight")}</a><p class="muted small">One primary action per local section. Focus remains visible.</p></div><div class="component-sample"><h3>Mentions and reported state</h3><div class="sample-row">${mention("atlas")}${mention("mira")}</div><div class="sample-row">${statusBadge("open")}${statusBadge("in_progress")}${statusBadge("done")}</div><p class="muted small">Named recipients and text labels carry meaning alongside color.</p></div><div class="component-sample"><h3>Fields and helpful errors</h3><div class="field"><label for="system-field">What needs to happen?</label><input id="system-field" placeholder="Review the first-session flow"><span class="help">Use a title the next agent can act on.</span></div><div class="field" style="margin-bottom:0"><label for="system-error">Connection code</label><input id="system-error" value="123456" aria-invalid="true" aria-describedby="system-error-text"><span id="system-error-text" class="field-error">That code isn’t valid. Ask your workspace owner for a new one.</span></div></div><div class="component-sample"><h3>References and feedback</h3><div class="reference-row"><button class="reference" type="button" data-action="brief">${icon("FileText")}Project brief</button><button class="reference" type="button" data-action="reference" data-title="First-session flow">${icon("Note")}First-session flow</button></div><div class="notice" style="margin-top:22px">${icon("CheckCircle")}<span>Your note is saved. The next assistant can pick it up here.</span></div><div class="notice warning" style="margin-top:12px">${icon("Clock")}<span>Mentioned, not yet acknowledged.</span></div></div></div></section>
    <section class="system-section"><h2>Built to be read.</h2><div style="max-width:680px">${noteCard(state.notes[0])}</div></section><section class="system-section"><h2>Try the whole handoff.</h2><div class="sample-row"><a class="button secondary" href="#/join">Join a workspace ${icon("ArrowRight")}</a><a class="button secondary" href="#/project">Read project notes ${icon("ArrowRight")}</a><a class="button primary" href="#/request/new?note=note-1">Create a request ${icon("ArrowRight")}</a></div></section></main>`;
}

function openDialog(title, content) {
  previousFocus = document.activeElement;
  const overlay = document.querySelector("#overlay");
  if (overlay.open) overlay.close();
  overlay.innerHTML = `<header class="dialog-header"><h2 id="dialog-title">${escapeHtml(title)}</h2><button class="icon-button" type="button" data-action="close-dialog" aria-label="Close dialog">${icon("X")}</button></header><div class="dialog-body">${content}</div>`;
  overlay.showModal();
  const field = overlay.querySelector("input:not([type=checkbox]),textarea");
  if (field) field.focus();
}

function closeDialog() { document.querySelector("#overlay").close(); if (previousFocus?.isConnected) previousFocus.focus(); }
function showBrief() {
  openDialog("Customer onboarding", `<div class="body-copy"><p class="muted small" style="margin-bottom:16px">Project brief / Fieldwork</p><h2 style="margin-bottom:14px">A first session that gets somewhere.</h2><p>Help a new team move from sign-in to a useful first action with minimal setup.</p><p><strong>What we’re working toward</strong><br>A short flow that gives people a clear starting point, saves their progress and collects optional details later.</p><p><strong>Keep the context together</strong><br>Use notes for findings and decisions. Link those notes when asking another agent to take the next step.</p><p><strong>Ready for review when</strong><br>The proposed flow explains the first action, the empty state and what happens if someone leaves halfway through.</p></div><div class="reference-row"><a class="reference" href="#/request/new?note=note-1" data-action="close-on-route">${icon("Note")}Use this context in a request</a></div>`);
}
function showNote(id) {
  const note = state.notes.find((n) => n.id === id);
  if (!note) return;
  if (!state.readIds.includes(id)) { state.readIds.push(id); save(); }
  openDialog(note.title, noteCard(note, true));
}
function showNewNote() {
  openDialog("Leave a useful note", `<form id="note-form"><div class="field"><label for="note-title">Title</label><input id="note-title" name="title" required maxlength="120" placeholder="What should the next agent know?"></div><div class="field"><label for="note-body">Context</label><textarea id="note-body" name="body" required maxlength="6000" placeholder="Share the finding, decision or handoff. Include what is still open."></textarea><span class="help">This note stays in Customer onboarding.</span></div><footer class="form-footer"><button class="button ghost" type="button" data-action="close-dialog">Cancel</button><button class="button primary" type="submit">Publish note ${icon("ArrowRight")}</button></footer></form>`);
}

function eligibleMatches() { const term = (document.querySelector("#mention-search")?.value || "").replace(/^@/, "").toLowerCase(); return state.participants.filter((p) => p.id !== "sage" && !selectedRecipients.includes(p.id) && `${p.name} ${p.role}`.toLowerCase().includes(term)); }
function updatePicker(open = true) {
  const input = document.querySelector("#mention-search");
  const options = document.querySelector("#mention-options");
  if (!input || !options) return;
  const matches = eligibleMatches();
  pickerIndex = Math.max(0, Math.min(pickerIndex, matches.length - 1));
  options.innerHTML = matches.map((p, i) => `<button id="option-${p.id}" class="${i === pickerIndex ? "active" : ""}" role="option" aria-selected="${i === pickerIndex}" tabindex="-1" type="button" data-action="add-recipient" data-id="${p.id}">${avatar(p.id)}<span><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.role)}</small></span><span class="small">${p.via}</span></button>`).join("") + `<p class="picker-caption">${matches.length ? "Participants with access to this project" : "No other matching participants in this project"}</p>`;
  options.hidden = !open;
  input.setAttribute("aria-expanded", String(open));
  if (open && matches.length) input.setAttribute("aria-activedescendant", `option-${matches[pickerIndex].id}`);
  else input.removeAttribute("aria-activedescendant");
}
function drawRecipients() { document.querySelector("#recipient-chips").innerHTML = selectedRecipients.map((id) => mention(id, true)).join(""); }
function addRecipient(id) { if (!eligibleMatches().some((p) => p.id === id)) return; selectedRecipients.push(id); drawRecipients(); const input = document.querySelector("#mention-search"); input.value = ""; updatePicker(false); input.focus(); clearFieldError("mention-error", input); }
function fieldError(id, message, input) { const error = document.getElementById(id); error.textContent = message; error.hidden = false; input?.setAttribute("aria-invalid", "true"); }
function clearFieldError(id, input) { const error = document.getElementById(id); if (error) { error.hidden = true; error.textContent = ""; } input?.removeAttribute("aria-invalid"); }
async function copy(text, confirmation) { try { await navigator.clipboard.writeText(text); showToast(confirmation); } catch { openDialog("Copy this link", `<div class="field"><label for="copy-value">Link</label><input id="copy-value" readonly value="${escapeHtml(text)}"></div>`); document.querySelector("#copy-value").select(); } }

function render() {
  const hash = (location.hash || "#/project").slice(1);
  const [path, query = ""] = hash.split("?");
  const params = new URLSearchParams(query);
  currentRoute = { path, params, view: params.get("view") || "notes" };
  const app = document.querySelector("#app");
  const overlay = document.querySelector("#overlay");
  if (overlay.open) overlay.close();
  if (path === "/join") app.innerHTML = joinScreen();
  else if (path === "/system") app.innerHTML = systemScreen();
  else if (path === "/request/new") app.innerHTML = requestScreen(params.get("note"));
  else if (path.startsWith("/request/")) { const request = state.requests.find((r) => r.id === path.split("/")[2]); app.innerHTML = request ? requestDetail(request) : projectScreen("requests"); }
  else app.innerHTML = projectScreen(currentRoute.view);
  const screen = path === "/join" ? "join" : path === "/system" ? "system" : path.startsWith("/request/") ? "request" : "project";
  document.querySelectorAll("[data-review]").forEach((link) => { if (link.dataset.review === screen) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current"); });
  const filter = document.querySelector("#note-filter");
  if (filter) filter.value = noteFilter;
  if (params.has("note") && path === "/project") showNote(params.get("note"));
  document.title = `${({ join: "Join your workspace", project: "Customer onboarding", request: "A clear next step", system: "Design system" })[screen]} · Commons design study`;
}

document.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) {
    if (!event.target.closest(".mention-control")) updatePicker(false);
    return;
  }
  const action = target.dataset.action;
  const id = target.dataset.id;
  switch (action) {
    case "reset": state = initialState(); noteFilter = "all"; searchQuery = ""; save(); render(); showToast("Sample workspace reset."); break;
    case "new-note": showNewNote(); break;
    case "close-dialog": closeDialog(); break;
    case "close-on-route": closeDialog(); break;
    case "brief": showBrief(); break;
    case "open-note": showNote(id); break;
    case "reference": if (target.dataset.title === "Project brief") showBrief(); else openDialog("First-session flow", `<div class="body-copy"><p class="muted small" style="margin-bottom:18px">Sample reference / Proposed flow</p><ol style="padding-left:21px;line-height:2"><li>Sign in with Google.</li><li>Name the project and capture the goal.</li><li>Show one useful first action.</li><li>Save progress before optional setup.</li></ol><p style="margin-top:20px">Open question: what is the smallest useful action for a team arriving without an existing brief?</p></div>`); break;
    case "use-code": document.querySelector("#connection-code").value = DEMO_CODE; document.querySelector("#agent-name").focus(); break;
    case "copy-note": await copy(`${location.origin}${location.pathname}#/project?note=${id}`, "Note link copied."); break;
    case "copy-request": await copy(`${location.origin}${location.pathname}#/request/${id}`, "Request link copied."); break;
    case "mark-read": state.readIds = state.notes.map((n) => n.id); save(); render(); showToast("Notes marked as read. Request acknowledgements are unchanged."); break;
    case "add-recipient": addRecipient(id); break;
    case "remove-recipient": selectedRecipients = selectedRecipients.filter((value) => value !== id); drawRecipients(); updatePicker(false); document.querySelector("#mention-search").focus(); break;
    case "remove-reference": selectedReferences = selectedReferences.filter((value) => value !== id); document.querySelector("#attached-notes").innerHTML = attachedNotes(); break;
    case "attach-notes": openDialog("Link project context", `<form id="reference-form">${state.notes.map((n) => `<label class="source-option"><input type="checkbox" name="reference" value="${n.id}" ${selectedReferences.includes(n.id) ? "checked" : ""}><span>${escapeHtml(n.title)}<small>From ${escapeHtml(person(n.author).name)}</small></span></label>`).join("")}<footer class="form-footer"><button class="button ghost" type="button" data-action="close-dialog">Cancel</button><button class="button primary" type="submit">Link selected notes</button></footer></form>`); break;
    case "acknowledge": { const request = state.requests.find((r) => r.id === id); if (request?.recipients.includes("sage")) { request.acknowledged = true; save(); render(); showToast("Request acknowledged. It is still open."); } break; }
    case "system-feedback": showToast("The same feedback pattern appears across Commons."); break;
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "note-search") { searchQuery = event.target.value; document.querySelector("#note-feed").innerHTML = filteredNotes(currentRoute.view); }
  if (event.target.id === "mention-search") { pickerIndex = 0; updatePicker(true); }
  const errorIds = { "connection-code": "join-code-error", "agent-name": "join-name-error", "request-title": "request-title-error", "request-context": "request-context-error" };
  if (errorIds[event.target.id]) clearFieldError(errorIds[event.target.id], event.target);
});
document.addEventListener("focusin", (event) => { if (event.target.id === "mention-search") updatePicker(true); });
document.addEventListener("change", (event) => {
  if (event.target.id === "note-filter") { noteFilter = event.target.value; document.querySelector("#note-feed").innerHTML = filteredNotes(currentRoute.view); }
  if (event.target.id === "request-status") { const request = state.requests.find((r) => r.id === event.target.dataset.requestId); if (request && ["open", "in_progress", "done"].includes(event.target.value)) { request.status = event.target.value; save(); render(); showToast("Reported status updated."); } }
});
document.addEventListener("keydown", (event) => {
  if (event.target.id !== "mention-search") return;
  const options = document.querySelector("#mention-options");
  const matches = eligibleMatches();
  if (event.key === "Escape") { event.preventDefault(); updatePicker(false); }
  if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); pickerIndex = Math.max(0, Math.min(matches.length - 1, pickerIndex + (event.key === "ArrowDown" ? 1 : -1))); updatePicker(true); }
  if (event.key === "Enter" && !options.hidden) { event.preventDefault(); if (matches[pickerIndex]) addRecipient(matches[pickerIndex].id); }
});

document.addEventListener("submit", (event) => {
  const form = event.target;
  if (!["join-form", "note-form", "request-form", "reference-form"].includes(form.id)) return;
  event.preventDefault();
  const data = new FormData(form);
  if (form.id === "join-form") {
    const codeField = form.querySelector("#connection-code");
    const nameField = form.querySelector("#agent-name");
    clearFieldError("join-code-error", codeField); clearFieldError("join-name-error", nameField);
    if (String(data.get("code")).replace(/\s/g, "") !== DEMO_CODE) { fieldError("join-code-error", "That code isn’t valid for this preview. Use the sample code below.", codeField); codeField.focus(); return; }
    const name = String(data.get("name")).trim();
    if (name.length < 2) { fieldError("join-name-error", "Choose a name with at least two characters.", nameField); nameField.focus(); return; }
    state.name = name; state.participants[0].name = name; state.joined = true; save(); location.hash = "/project"; showToast(`Welcome, ${name}. You have access to Customer onboarding.`);
  }
  if (form.id === "note-form") {
    const title = String(data.get("title")).trim(); const body = String(data.get("body")).trim();
    if (!title || !body) return;
    const id = `note-${Date.now()}`;
    state.notes.splice(1, 0, { id, author: "sage", title, body, category: "Note", time: "Just now", references: [] }); state.readIds.push(id); save(); closeDialog(); render(); showToast("Your note is saved in the sample project.");
  }
  if (form.id === "reference-form") { selectedReferences = data.getAll("reference").map(String).filter((id) => state.notes.some((n) => n.id === id)); closeDialog(); document.querySelector("#attached-notes").innerHTML = attachedNotes(); }
  if (form.id === "request-form") {
    const titleInput = form.querySelector("#request-title"); const bodyInput = form.querySelector("#request-context"); const mentionInput = form.querySelector("#mention-search");
    clearFieldError("request-title-error", titleInput); clearFieldError("request-context-error", bodyInput); clearFieldError("mention-error", mentionInput);
    const title = String(data.get("title")).trim(); const body = String(data.get("body")).trim();
    if (!title) { fieldError("request-title-error", "Give this request a clear title.", titleInput); titleInput.focus(); return; }
    if (!body) { fieldError("request-context-error", "Add enough context for the next agent to pick this up.", bodyInput); bodyInput.focus(); return; }
    if (!selectedRecipients.length) { fieldError("mention-error", "Choose an agent who can pick this up.", mentionInput); mentionInput.focus(); return; }
    const id = `C-${String(14 + state.requests.length).padStart(3, "0")}`;
    state.requests.unshift({ id, title, body, recipients: [...selectedRecipients], references: [...selectedReferences], author: "sage", status: "open", acknowledged: false, time: "Just now" }); save(); location.hash = `/request/${id}`; showToast("Request created. The context is attached.");
  }
});

document.querySelector("#overlay").addEventListener("click", (event) => { if (event.target.id === "overlay") closeDialog(); });
window.addEventListener("hashchange", () => { render(); document.querySelector("#main h1, #main h2")?.focus({ preventScroll: true }); window.scrollTo(0, 0); });
render();
