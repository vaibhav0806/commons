# Commons design system · Study 02

> **Archived study.** This file records the November 2026 Graphite + Reflective direction. It is not implementation authority. Use [`../DESIGN.md`](../DESIGN.md) and [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) for the live Mist & Lilac system.

Status: **Consolidated foundations approved**. [Research](DESIGN_RESEARCH.md) · [Run the prototype](../design/README.md) · [Study 01](DESIGN_SYSTEM.md)

The approved consolidated system is now at [`DESIGN.md`](../DESIGN.md), with an [executable reference](http://localhost:4177/typography/?study=system). The owner approved the type scale, spacing, corners and hover/press responses, with text fields' outer focus outline removed. This document retains the earlier study and animation history; the root system governs new work.

## Character

A quiet working room for durable context. Charcoal surfaces provide structure; documents provide the substance. The four-part Commons mark and neutral emphasis connect the entrances, workspace and handoff states. Avoid decorative dashboards, generic metric cards and unrelated animated effects.

The current workspace revision takes its simplicity from a project list: one navigation rail and one content column. Each project shows two sections, Requests and Notes. Request rows identify who asked whom; note rows identify their author. Full documents and requests open only when selected. Completed work is collapsed by default. The earlier three-column index/reader layout was rejected as too busy, while the dark visual direction and onboarding were liked.

## Foundations

**Approved palette and material: Graphite + Reflective.** The owner selected this combination from the [interactive study](http://localhost:4177/typography/?study=materials&palette=graphite&material=reflective). Use neutral graphite surfaces, silver emphasis, soft surface gradients, restrained pointer-responsive edge light and primary-button highlights. Reading content stays stable. Ice blue, Iridescent and Matte remain comparison options, not active directions. The approved Graphite values are in [`design/typography/materials.js`](../design/typography/materials.js); its material treatment is in [`materials.css`](../design/typography/materials.css).

The active mock now loads the approved foundations from `design/commons.system.css` and component rules from `design/v2/system.css`, after its historical stylesheet. Root `DESIGN.md` is the current authority.

| Semantic token | Value | Role |
| --- | --- | --- |
| Canvas | `#0B0C0E` | Workspace and reading area |
| Navigation | `#101114` | Persistent project navigation |
| Panel | `#17191D` | Forms, note preview and request sheet |
| Raised | `#202328` | Raised surfaces and reflective gradient's lighter endpoint |
| Hover | `#292D34` | Transient pointer/keyboard selection |
| Border | `#30353E` | Content grouping |
| Strong border | `#677282` | Fields and interactive surface boundaries |
| Text | `#EEF0F3` | Headings and primary reading |
| Body text | `#C2C7D0` | Sustained reading |
| Muted text | `#A7AEBA` | Supporting descriptions |
| Quiet text | `#959EAC` | Metadata |
| Emphasis | `#C8D0DC` | Silver links and emphasis |
| Primary action | `#DBE0E8` on `#12161C` | Button surface and text respectively |
| Focus | `#BCCADC` | Visible keyboard focus |
| Field focus | `#8C97A6` | Existing text-field border only; no outer ring, outline, glow or shadow |
| Confirmation | `#ADD2BB` | Explicit saved/acknowledged states |
| Warning | `#E6BFB0` | Warning states, paired with a label/icon |
| Error | `#F0A5B5` | Inline form errors |
| Reflective light | `#E8F2FF` to `#9BAAC1` | Thin surface-edge reflection |

Status also uses text and an icon. Border colors group content; focus and form errors have separate signals. Stronger outlines and readable labels identify fields. This dark study is independently styled; the earlier light study remains available for comparison rather than claiming theme parity.

Verified Graphite contrast pairs in the study: body text on raised surface 9.29:1, muted text on raised surface 7.06:1, quiet metadata on raised surface 5.83:1, primary-button text 13.69:1, field boundary on panel 3.61:1 and focus on raised surface 9.47:1. This covers the listed pairs rather than certifying every rendered state.

### Approved typography · 2026-11-14

The owner selected this pairing after reviewing the [interactive typography study](http://localhost:4177/typography/). These font-family decisions supersede earlier Geist-only and system-monospace guidance in this document.

| Role | Approved family | Usage |
| --- | --- | --- |
| Headings | **Space Grotesk** | Page, section and document headings |
| Body and controls | **Geist** | Notes, descriptions, navigation, buttons, labels and form inputs |
| Identifiers | **Geist Mono** | Connection codes, literal identifiers and technical values; use tabular numerals where aligned numbers need them |

**Stored alternate: Sora.** Keep Sora available as a deliberate alternative for headings, body text and controls, including the whole-interface option shown in the study. It is an approved backup direction, not the active family and not an automatic fallback for Space Grotesk or Geist. Switching to it requires an explicit design decision so screens do not mix directions accidentally.

The comparison page defaults to the approved pairing and retains all three candidates. Geist is at [`design/assets/geist-latin.woff2`](../design/assets/geist-latin.woff2); Space Grotesk, Geist Mono and Sora are self-hosted with their OFL licenses in [`design/typography/fonts/`](../design/typography/fonts/). The active mock uses the approved pairing; Sora remains available in the comparison.

**Existing prototype scale, pending review:** display 36–38/42px, project title 28/34px, document title 34/39px, document body 14/26.6px, controls 12–13/18px, metadata 10–12/16px. List titles use 14px, bylines 12px and section headings 16px. These are existing study measurements, not newly approved sizes. Authorship must remain readable without opening an item. Small metadata is secondary; critical actions and errors retain readable labels.

**Spacing:** 4px base; 8, 12, 16, 20, 24, 32, 40, 48 and 64px. Group tightly related controls; separate sections with space and single rules. Desktop navigation is 230px. The main column has a maximum outer width of 856px, including horizontal padding, and contains both project sections. Detail sheets max out at 600px. Narrow screens use the same lists and full-width details, with compact navigation. They keep request authorship and status visible.

**Form:** 6–8px control radii, 8–10px surface radii. No heavy shadows on ordinary content. Shadows belong to overlays; thin lines and surface levels establish the workspace hierarchy. Reuse the local Phosphor icon sprite at a consistent size and weight.

## Components and behavior

| Component | Contract |
| --- | --- |
| Primary action | Neutral light surface, dark text, compact label; pending state disables the action and exposes text feedback |
| Secondary action | Raised surface with a restrained border; no competing accent colors |
| Field | Persistent label, helper, visible focus and adjacent error; preserve input after validation failure |
| Join code | A single paste-friendly numeric field; decorative digit boxes only display the issued code |
| Project list | Requests and Notes are separate named sections with a one-sentence explanation. No permanent reader, duplicated tabs or breadcrumb bar. |
| Request row | Verb-led title, “Codex asked Grok Bot” and a readable waiting/acknowledged state. Completed rows are disclosed separately. |
| Note row | Title, “Note by Grok Bot”, time and optional pinned context; full content opens on selection. |
| Note detail | Author, readable content, source references, related requests and “Ask an agent about this”. Read position is distinct from acknowledgement. |
| Mention picker | Only sample authorized project participants; searchable combobox with arrows, Enter and Escape |
| Request detail | Explicit Requested by / Asked to respond fields, current state, attached context and a result note when present. History is collapsed. |
| Detail sheet | Inert background, contained keyboard focus, Escape/dismiss, preserved project scroll and focus restored on close. |
| Feedback | Local success appears where the action finishes and in a short status message; no simulated recipient response |

## Connected first-use experience

1. Human chooses **Continue with Google**. The prototype explicitly simulates this action.
2. A dedicated workspace step prefills a name from the Google profile, such as “Vaibhav’s workspace”. The name is editable. The local study uses a clearly identified demo profile.
3. A separate step asks for the first project. Its parent workspace is named in plain text. **Create workspace** confirms both. The human does not create or name an agent.
4. Human chooses project or whole-workspace scope, generates a sample code and copies instructions.
5. Agent opens the web entrance, supplies the code and chooses its own name. Success states the granted scope, without another owner approval.
6. Agent reads a note and creates a directed request with eligible mentions. A source note can be attached; starting from “Ask an agent about this” preselects that note.
7. The request remains available for the recipient’s next visit. Read, acknowledged and completed are separate actions.

Browser and MCP are two planned entrances to the same records. Only the browser UX is simulated here. A code does not configure an MCP client, wake an assistant or guarantee that it returns.

## Motion contract

Native CSS and Web Animations demonstrate these timings. Animate transforms and opacity, avoid layout animation, and never use `transition: all`.

| Event | Timing | Purpose |
| --- | --- | --- |
| Hover/selection | 130–150ms | Show the control responds |
| Item selection | 320ms sheet entrance | Reveal one note or request without adding a permanent reader column |
| Onboarding forms | 240ms between steps | Replace only the left-hand content; preserve the shared story DOM and playback position |
| Connected handoff | 16s parallel / 18s sequential | Codex’s build note and Instinct’s demo update become one Grok Bot launch draft |
| Issued code | 350ms with 35ms digit offsets | Make the newly available code recognizable |
| Request opens/closes | 320ms entrance / 160ms exit | Establish a temporary layer beside the document |
| Mention insertion | 180ms, subtle opacity/scale | Confirm the chosen recipient |
| Dialog | 220ms, 8px / 0.99–1 scale | Introduce source context without a route change |
| Pending → saved | 300–550ms simulated pending, 240ms settle | Demonstrate progress and an explicit result |

The short pending intervals are prototype choreography, not real request timings. Production pending states must follow actual work. The onboarding product sequence repeats at the owner’s request. Its DOM and animation clock persist through sign-in, workspace naming, project creation, connection-code generation and agent entry. There is no visible pause button, progress bar or “example workflow” label. Keyboard focus holds the scene for reading; reduced motion reveals the completed result immediately. Leaving onboarding removes it. The design-system screen also offers explicit replay controls. Typing is confined to the illustrative post. The user’s form never progresses automatically.

`prefers-reduced-motion` removes entrances, staggering, rotation and simulated waiting. Every outcome remains readable without movement. Content is present in the DOM rather than hidden until a scroll animation runs.

## Review and acceptance

Inspect the project overview, a note, a request and a completed handoff. Without opening help, identify what a note is, who raised each request and who should respond. Then check mentions, optional note attachment, filtered catch-up and the existing entrances on desktop and mobile. Judge whether the two lists make the collaboration model clear. Keep the earlier light version available until this direction is reviewed. Production implementation remains gated on that review.

The prototype uses real product names and marks in an illustrative scenario, backed by local browser state. [Logo provenance](../design/assets/brands/SOURCES.md) records the assets. The names and marks do not certify integrations. It does not implement account authentication, server authorization, code entropy/expiration, integrations, or real agent execution. The request acknowledgement demo is an explicit user action; a created request does not silently acknowledge itself.


## Onboarding refinement

The amber accent and oversized input outlines were removed after owner feedback. Fields keep a neutral focus border rather than a colored outline. Keyboard focus remains visible on actionable controls. Scope and acknowledgement are plain icon/text treatments, and agent identities use recognizable product marks with names rather than colored initial tiles. The existing workspace layout is retained in this pass.

The right-hand product sequence is staged: **Codex build note + Instinct demo update → human request → Grok Bot X draft for review**. It does not represent live calls or publication to X. Under reduced motion, all three contributions and the completed draft are visible immediately, with no loop. On small screens, the form comes first, followed by the same story with vertically stacked source cards.


## Connected product motion · current revision

The owner welcomes cards, chips, statuses and typing when they clearly explain collaboration. The latest feedback requests slower pacing, typed Codex context, the owner's actual X avatar and a much smaller post. The source notes now carry the primary visual weight; the X draft is a compact outcome rather than a hero object. Its 105-character copy still uses both contributions.

| Beat | Time | Visible change |
| --- | --- | --- |
| Codex writes | 0.6–4.1s | Heading types first, then the build note. The state resolves to Shared. |
| Read Codex's note | 4.1–7s | No new actor starts; the completed note remains readable. |
| Instinct contributes | 7–9s | The confirmation count reaches ten; Friday is the demo day. |
| Read Instinct's update | 9–11.8s | Both source records stay visible before the next action. |
| Human request and context handoff | 11.8–14s | A compact request appears, followed by the context traces and source citations. |
| Grok Bot drafts | 14–18.1s | The short post types from the shared build and demo context. |
| Review together | 18.1–24.5s | All contributions and the compact result remain readable. Post is never pressed. |
| Reset | 24.5–26s | Typed text and request fade while the surfaces stay present. |

The X composer is 440px wide by approximately 247px high at the 1440px reference viewport, compared with about 550px by 366px previously. It has quieter framing, a 30px profile image and a shorter reserved body. The local image was retrieved from the owner's X profile at their request; provenance is in the asset notes.

DOM, CSS and SVG provide the surfaces and movement; one native animation clock drives text and count updates. The scene and clock stay mounted between onboarding steps. Keyboard focus holds the illustration. Reduced motion gives a complete static frame. The source notes, requests, bookings and post copy are staged product explanation; no external agents execute and no post is published. Use `?t=20` for a review frame and `?reduced=1` for the static alternative.

The reference observations are in [design research](DESIGN_RESEARCH.md). Production implementation remains gated on review of the isolated study.


## Motion comparison · current alternatives

This supersedes the earlier 26-second pacing above. The owner requested an expedited parallel version and a separate one-at-a-time variant for direct comparison.

| Version | Contributions | Handoff and result | Loop |
| --- | --- | --- | --- |
| Parallel, port 4177 | Codex types while Instinct confirms demos; both finish at 3.5s. | Source notes hold for reading, the source outlines complete at 3.5s, both traces move together at 3.5–4.5s, Grok Bot drafts at 4.5–7.7s, result holds to 15s. | 16s |
| Sequential, port 4178 | Codex is visible first; it exits before Instinct appears. Instinct finishes its update and exits before Grok Bot appears. | Grok Bot reads the shared notes and drafts at 9.6–12.8s; result holds to 17s. | 18s |

The alternate keeps a stable stage, matching card surfaces, typography and content. Short vertical entrances/exits carry the transition, with no overlapping actor cards. Its reduced-motion state shows all completed contributions statically. The shared animation clock and onboarding continuity remain intact in both variants. The comparison page's labels and replay control are review tools outside the product illustration.

[Side-by-side review](http://localhost:4178/compare.html) · [Parallel onboarding](http://localhost:4177/v2/?flow=7#/start) · [Sequential onboarding](http://localhost:4178/sequential/?flow=7#/start).


## Selected parallel flow · source outlines

The owner selected the parallel composition. Codex and Instinct now each have a single thin SVG perimeter stroke, starting at the bottom-centre connection point when their work begins. Both strokes draw around the real rounded-card geometry and complete when the contributions finish at 3.5 seconds. The travelling strokes immediately continue down the existing connector paths and merge into one visible shared stem by 4.5 seconds. The source rims then fade back to the quiet base borders. Grok Bot has no animated perimeter or added emphasis ring; its existing static border remains.

The 16-second cycle stays intact. Grok Bot now drafts from 4.5–7.7 seconds, leaving the rest of the hold for reading. A ResizeObserver fits each source path to its card on resize; the observer is disconnected when the scene is replaced or left. The same clock controls all strokes and text, including keyboard-focus hold and deterministic review seeking. Reduced motion hides the moving outlines and exposes the completed result. The sequential alternative is unchanged.


## Draft reveal · selected parallel version

The X composer is hidden at the start, while keeping its space reserved to prevent the source notes from jumping. After both notes finish, the request appears at 3.5–3.8 seconds. Grok Bot's logo/name enters at 3.85–4.15 seconds. The draft shell fades and lifts in at 4.5–4.85 seconds, synchronized with the first typed text; the empty input placeholder is removed. The whole result fades out after the hold. Reduced motion shows the completed result immediately. This keeps the current 10.3-second loop and the 3-second completed-post-to-next-work interval.


## Readable handoff and agent reply · earlier parallel sequence

The parallel composer no longer contains Build note / Demo update source chips. Grok Bot says “Here’s your launch post.” between its identity row and the draft card. The shared lines travel over 1.7 seconds, then the request/context gets a reading pause before drafting. The request is also slightly larger on desktop.

Current timing: source work completes at 3.5s; the request enters at 3.5–3.85s; the lines finish their handoff at 5.2s; Grok Bot's identity enters at 5.35–5.65s; its reply appears at 6.1–6.4s; the post enters at 6.7s and finishes typing at 10.5s. It holds to 12.1s, resets through 13.1s and source work resumes at 13.5s. The completed-result-to-next-work interval remains 3 seconds. Use `?t=11.2` for the current completed frame. The sequential reference is unchanged.


## Single project update · current onboarding illustration

One Codex contribution lives directly beneath the Commons project header. It types the product update and identifies the two shared inputs in plain language: product notes and ten alpha signups. Two highlighted inline identities and short requests form the separate branches below. There are no source cards, file-preview panels or reading-state background flashes. Calendar and X remain recognisable independent results with named sample attendees and the approved launch post.

The message is 20px on a typical desktop, with 14px agent identities and X copy, 13px calendar entries and 13px request copy. Agent marks are 27px. The stage uses a little more of the available width, and the result cards have matching 296px desktop heights. Smaller laptop layouts use slightly more compact type; mobile puts the requests and outcomes in normal document flow. Thin paths and one moving dot per path explain the read, rather than decorating the entire surface.

The source message types from 0.4 to 2.8s. Requests enter at 3.0–3.5s; agents read and work in the following beats. Results finish at 12.6s, hold until the reset begins at 16.4s, then source work resumes at 17.6s: five seconds after completion, with a 17.2s runtime loop. Seek `?t=13.2` for the completed state. The keyboard hold, static reduced-motion result and preserved onboarding clock remain. The other assistant variants remain historical references. All content and external results are local staged simulation; Commons is not waking agents, booking meetings or posting to X.


Outcome cards identify their contributing assistant with its official mark in the top-right corner. Separate agent heading/status rows are omitted. The Calendar identity remains in its header, and X identifies the post surface at the bottom-left of its footer. Agent names remain on the originating mentions.


## Inline-mention fork · current experiment

The two requests are now paragraphs in Codex's message, using the same body size. A highlighted identity appears inline once, followed by a typed request without a comma. The separate mention/caption section is removed. The update has three parts: launch readiness, the Instinct demo request and the Grok Bot launch-post request.

One 1px fork starts below the complete message region and ends at each card's centre. Its 58px desktop geometry adapts to the grid gap and available width, with 10px corner bends. Source copy and names do not anchor the connectors. Narrow screens use a vertical stem and stacked artifacts. No card-background highlight is added. The source writes from 0.4 to 4.5s, the read trace begins at 5.3s, and outcome timing and the five-second restart interval remain as before.
