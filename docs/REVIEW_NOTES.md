# Documentation review record

## Round 1 · 2026-11-13

Submitted through Plannotator across the PRD, technical decisions, README, architecture, onboarding and roadmap. Decision: **annotated**, not approved.

| Feedback | Round 2 revision |
| --- | --- |
| Product is OSS for a broad audience; remove personal framing | Rewrote PRD/README for users and self-hosters; removed the first user's name from active product docs |
| UX must be excellent | Added explicit journey, notes-first project home, mention selection and browser/mobile/accessibility acceptance; UX prototype review before full UI |
| Consider Google sign-in only | Replaced email-code/link requirements with Google-only human sign-in across active docs |
| Catch-up looks good | Preserved and emphasized catch-up, read position and last observed visit |
| Agents can tag other agents on requests/tasks | Added structured mentions, directed requests, acknowledgement and project-access constraints |
| Collaboration is asynchronous notes rather than real-time conversation | Replaced chat/conversation framing with durable notes and direct context retrieval |
| Need a concrete tech stack | Added Next.js/TypeScript, Tailwind/shadcn, PostgreSQL/Drizzle, Better Auth/Google, official MCP SDK, Vitest, Playwright and Docker/Compose recommendation |
| README should describe the future product and follow OSS conventions | Rewrote around purpose, features, usage examples, joining, interfaces and contributing; moved current scaffold details to CONTRIBUTING.md |
| Remove domain-purchase/pricing/status/review-index/repository-inventory clutter | Removed those sections from README |
| Include recognizable local/personal assistant examples | Added Claude Code, Codex, OpenCode, Grok Bot and Instinct as intended use cases, without certification claims |
| Architecture looks good | Preserved the accepted shared-service structure; aligned Google auth, notes and mentions only |

Readme structure references: [Cal.diy](https://github.com/calcom/cal.diy/blob/main/README.md) and [Plane](https://github.com/makeplane/plane/blob/preview/README.md). These informed organization, not copied product claims or setup commands.

Round 2 is a document revision. Product code and installed dependencies are unchanged. The stack recommendation, pairing/auth details and revised scope await review.

## Round 2 · approved

The reopened Plannotator session returned `decision: approved` for the seven-document set. Approval included guidance to research modern November 2026 UI libraries and improve cohesion and visual design beyond a generic Tailwind/shadcn selection.

The design note is guidance, not a blocking change request. The approved documents were not rewritten over it, and no product code or dependencies were changed. The UI recommendation is being researched separately for the upcoming design phase. Unresolved technical questions identified by the documents still require evidence before their implementation can be called complete.

## Design study · authorized

The project owner explicitly agreed to define a Commons design system and design three connected screens: agent joining, project notes and a request with mentions. The study is isolated in `design/`, with reusable CSS tokens and the design specification in `docs/DESIGN_SYSTEM.md`. It uses labelled fictional content and local browser state. Production application code, authentication, database and MCP remain outside this task.

## Design study 02 · dark revision requested

The owner found Study 01 clean but generic and requested a stronger dark direction, reference research and visible animation. Public pages from Roma, Simulithic, beUI and Vercel were inspected, together with relevant OSS design/critique resources. Findings are in `DESIGN_RESEARCH.md`.

The new isolated study at `design/v2/` adds the owner’s onboarding and scoped-code flow, agent-led joining, a note index/document layout, request sheets, keyboard mentions and actual transition/feedback motion. `DESIGN_SYSTEM_V2.md` records the new foundation and motion contract. Study 01 remains available. This revision awaits visual review; no production source, dependencies, authentication, database or MCP implementation is changed.


## Workspace revision · simpler project layout

The owner liked Study 02’s visual direction but found the workspace too busy and its collaboration model unclear. They requested a simpler layout, citing Todoist. This is feedback on the main workspace, not approval of the complete UI.

The isolated study now has one project column with Requests and Notes sections, explicit requester/recipient copy, on-demand note/request details and collapsed completed work. A completed sample request links its result note to make the handoff visible. The code/onboarding theme remains intact. Production files and dependencies remain unchanged; the new layout awaits visual review.


## Onboarding revision · real agent story and separate setup steps

The owner limited this pass to onboarding. They requested removal of the amber accent, colored field outlines, initial-based agent avatars and boxed scope/status treatments. They asked for a repeated real-product example of sharing build context with a writing assistant, and for that animation to keep playing instead of remounting after Continue with Google.

The isolated study now illustrates Codex sharing a build note, Claude Code adding context and Grok Bot preparing X drafts for review. It uses product marks, an 18-second repeat, pause/play and a static reduced-motion state. Only the left form content changes between onboarding routes. Workspace naming is prefilled from a demo Google profile, followed by a separate first-project step and the existing scoped-code flow. The simplified workspace layout and production implementation gate remain in place. This revision awaits review.


## Onboarding motion revision · connected product flow

The owner supplied Wajo as a future workspace reference and a Roma task-connection image as motion inspiration. They explicitly limited this pass to onboarding animation: faster pacing, more useful activity, automatic looping, no pause button, no animation progress bar and no “example workflow” label.

The right-hand panel now shows a connected 12-second handoff: Codex’s build note moves through the agent rail, Claude Code attaches it to a request, and Grok Bot leaves three X drafts for review. The complete result is visible at roughly six seconds and remains readable before reset. Permanent product surfaces prevent blank stages. Keyboard focus can hold the scene without visible playback controls; reduced motion shows a static completed result. The independent clock remains mounted between onboarding steps. The main workspace and setup forms were not redesigned in this pass.


## Pixel design review · sent 13 November 2026

At the owner’s explicit request, Codex emailed Pixel at `pixeldesign@mail.grokbot.com` from the connected Gmail account. Subject: **Commons onboarding animation — candid UI/UX review + full feedback and screenshots**. Gmail confirmed message `1a1d4e4d5cb34e6b` in SENT; the message and its `commons-pixel-review-packet.zip` attachment were read back. This confirms sending, not delivery or a response.

The email body contains the complete design-feedback history, the current product boundaries, the latest critique and Codex’s own critique. The packet contains eight PNGs, a 12.4-second H.264 recording, a self-contained HTML preview, original source as Markdown, and product/design context. It excludes credentials, databases and unrelated personal browser chrome. The brief is retained in `PIXEL_REVIEW_BRIEF.md`.

Pixel was asked for a candid diagnosis, the smallest credible agent story (prefer a direct Codex → Grok Bot handoff), two full-pane compositions with one recommended choice, minimal copy, a recognizable X-draft treatment and a timed automatic-loop storyboard. A third agent must have a necessary distinct role. The current UI remains available for review; the next animation revision has not been implemented while awaiting this design input.

Reply thread: https://mail.google.com/mail/u/?authuser=vaibhav.pandey0806%40gmail.com#all/1a1d4e4d5cb34e6b


## Launch illustration · research-led revision

The owner clarified that the problem was craft and visual explanation, not the presence of cards, chips, statuses or typing. They authorized a new mock, with research shown first. Live public Roma, Simulithic, Sim, Gumloop and beUI references were inspected; the observations and a chosen composition were shared before prototype edits.

The isolated onboarding illustration now shows Codex and Instinct contributing notes to one launch, a compact human request, and a larger Grok Bot X-style draft that uses both notes. The right pane is wider; the enclosing 500px frame and redundant agent rail are gone. Real product marks replace the Claude Code intermediary; the original Instinct public home mark is retained with provenance. The cards use the existing dark tokens, compact Shared statuses, a Friday label and a confirmation count. Post typing resolves around 6.2 seconds, followed by a readable hold and a 14-second loop. Nothing is published or executed.

Verified seven viewport widths (320–1920), image loading, all onboarding transitions, persistent scene/clock identity, keyboard hold, reduced motion and representative frames. No observed JavaScript errors or horizontal overflow. The human setup forms, workspace and production source were not implemented or redesigned. This revision awaits owner review.


## Reading pace and balanced collaboration · polish

The owner and a friend found the loop too fast, especially while reading the source notes. The owner requested typing in Codex's contribution, their actual X profile photo, shorter post copy and less space devoted to the X composer so the collaboration stays central.

The loop is now 26 seconds. Codex types its heading and note, then holds. Instinct works only after that reading interval and gets its own hold. The request, visible context transfer and Grok Bot draft follow. The completed contributions remain together for about six seconds. Codex's first frame is not pre-filled. The post is 105 characters, down from 172; at 1440px its card occupies about 54% of its previous area. Its X avatar and displayed name were retrieved from the owner's actual profile, as requested, and saved locally without image alteration.

Seven viewport widths (320–1920), staged typing/count/handoff/result/reset frames, local image loading, reduced motion and preserved onboarding scene/clock identity were checked. The full draft fits its reserved body at 320px. No observed JavaScript errors or horizontal overflow. This remains an isolated local simulation for review.


## Parallel versus sequential comparison

The owner requested two alternatives: accelerate the current scene by having Codex and Instinct work and finish together, and create a separate localhost version where only one agent appears at a time (Codex → Instinct → Grok Bot).

The main scene on port 4177 now repeats in 16 seconds. Both source agents start around 0.4 seconds and finish at 3.5 seconds; a shared reading hold precedes synchronized traces into Grok Bot, whose draft completes at 10.4 seconds. The alternate on port 4178 repeats in 18 seconds: Codex completes its note, exits, Instinct appears and contributes, then Grok Bot appears with both sources. No two actor cards overlap in the alternate. Reduced motion shows the completed contributions together rather than hiding source context.

A dedicated comparison at http://localhost:4178/compare.html embeds only the two illustrations at comparable viewport sizes, with Replay both and links to the complete onboarding flows. The alternate is an HTML entry plus a small composition stylesheet; it shares the existing forms, assets and explicit per-variant timing renderer. Browser storage remains separated by port. Two lightweight static servers serve these local studies; no production application or external-agent execution was added.

Both variants were checked at seven viewport widths, their meaningful typing/finish/handoff/hold/reset phases, image loading, reduced motion and scene/clock preservation through sign-in. Parallel completion is synchronized at 3.5 seconds. Sequential visibility is exclusive in the inspected phases. The comparison replay and a normal-speed playthrough were also checked. This is a visual comparison for owner review, not an integration test.


## Parallel selected · outlines become the shared flow

The owner preferred parallel and requested a moving outline on the Codex and Instinct cards while they work, with each stroke feeding into the shared connector when the work completes. They explicitly excluded an animated outline on Grok Bot.

Each source now draws one perimeter stroke from its bottom-centre connection point, completes at the synchronized 3.5-second finish and immediately hands the stroke into the existing merging paths. The source outlines fade as the flow travels down; the old full-card emphasis borders are disabled for this variant. Grok Bot retains only its static border. The overall loop remains 16 seconds, with the draft now typed at 4.5–7.7 seconds. The sequential version is retained unchanged for reference.

Inspected working, completed-outline, transfer, shared-stem, result and reset frames. Verified path fit during resizing at seven viewport widths (320–1920), two source outlines and zero Grok outlines, preserved scene/clock through onboarding, no running animation in reduced motion and no observed JavaScript errors or horizontal overflow. The source geometry follows the actual cards; this is still an illustrative local product sequence.


The source outlines now depart in opposite directions: Codex goes left from its bottom-centre point; Instinct goes right. Both still complete together and feed the same merging path. The Instinct SVG path is mirrored within its measured card width, retaining the same timing and endpoints. Grok Bot remains without an animated outline.


The owner shortened the finished-result-to-next-work interval to 3 seconds. The selected parallel loop is now 10.3 seconds: the post still finishes at 7.7 seconds, holds to 9.3 seconds, fades/resets to 10.3 seconds and the agents resume at 10.7 seconds (the next cycle’s 0.4-second mark). Source work, opposite-direction perimeter strokes and the handoff retain their original absolute timings. The sequential alternative remains 18 seconds.


## Draft entrance after the handoff

The owner found the empty X composer distracting at the beginning and requested a staged appearance. In the selected parallel version, the request now appears after both source notes complete (3.5–3.8s), Grok Bot's identity fades in (3.85–4.15s), then the draft card fades and lifts in while typing begins (4.5–4.85s). There is no visible empty-composer placeholder. The identity and card fade out after the reading hold. Their layout space remains reserved, preserving the source-card positions and shared path. The 3-second finished-post-to-next-work interval, opposite source-outline directions and absence of a Grok Bot animated outline remain intact. Reduced motion shows the full completed scene. The sequential comparison is unchanged.


## Grok Bot reply and a readable handoff

The owner requested a short Grok Bot utterance above the result, removal of the Build note/Demo update chips inside the post, and more reading time around the human request and merging paths. The current parallel scene now shows “Here’s your launch post.” beneath Grok Bot’s identity and above the X card. The source chips are removed from the parallel composer; the staged post text still uses both contributions.

Source work and opposite perimeter strokes finish at 3.5s as before. The request appears at 3.5–3.85s, the shared flow travels more slowly through 5.2s, Grok Bot’s identity enters at 5.35–5.65s, and its reply at 6.1–6.4s. The draft enters at 6.7s and types through 10.5s. This makes the request readable before the result begins. The finished-post-to-next-work interval remains exactly 3 seconds: hold to 12.1s, reset through 13.1s, next source work at 13.5s. The sequential alternative remains available without these parallel-only changes.


## Approved demo copy · platform, leads and launch post

After requesting a wording review, the owner chose the casual launch post (option 1) and approved the business-focused source scenario. Codex now says “The platform is ready.” with “Core features built and tested. Ready for customer demos.” Instinct says “First leads lined up.” with ten potential customers and demo calls booked for Friday. “Customer demos” fits the agreed Friday-call story. These are illustrative records in the local study, not production verification or actual customer activity.

The approved X draft is: “My AI assistants have a shared workspace now. They can leave notes, share context, and pick up where another left off. I’m retiring from copying things between them.” It retains the approved paragraph break after “now.” The divider above the toolbar has 24px of space after the reserved post body. The visible text and hidden sizing layer share the exact same copy, so the card grows only as needed and remains stable while typing. The handoff timing, opposite source outlines, staged draft reveal and three-second restart gap are unchanged.


Removed the small agent-header labels at the owner’s request: Build note, Demo/Lead update, and Grok Bot’s transient Drafting / For your review text. Agent identities and logos remain, as does “Here’s your launch post.” The source-card activity statuses remain. The approved platform/leads copy, option-1 launch post and 24px footer spacing are applied.


Clarified Instinct’s role after owner feedback: it coordinates calendar bookings, not lead generation. Its heading is now “Demo calls booked.” with the count of ten customer demos scheduled for Friday. The illustration’s accessible description uses the same scheduling meaning. Other copy and motion remain unchanged.


Shortened the launch draft after owner feedback: “Launching Commons. A shared workspace for my AI assistants to leave notes, share context, and pick up where another left off.” The opening is a separate paragraph. The retirement/copying line is removed. Other copy, spacing and motion are unchanged.


## Start screen · minimal left column

The owner approved the launch post and requested less left-column copy because the right-hand scene now explains the use case. The start screen retains the Commons brand, “Your agents. On the same page.”, Continue with Google and a quieter “Join as an agent” link. The eyebrow, agent-specific explanatory paragraph, repeated footer tagline, sample-workspace footer link and verbose simulated-sign-in sentence are removed from this screen. The prototype’s existing Local demo disclosure remains in the review bar, and the setup screen still identifies the demo profile.

Start-only grid alignment keeps the short action group centred without relying on the old footer as a spacer. Other setup forms retain their current layout and footer. The approved X draft and right-side sequence are unchanged.


## Start screen · balanced composition

Centred the short sign-in group horizontally and vertically within the left panel, independently of the top brand. The desktop split moves from 40/60 to 46/54, and the workflow has a 900px maximum width so it stays proportionate on larger displays. The headline, button and agent entrance share one centre line; the button is capped at 340px. No explanatory copy was added. The approved scenario, draft and animation timing are retained. Setup screens use the same column split to avoid a width jump when continuing.


## Pixel · final screen polish request

At the owner's explicit request, sent Pixel the latest full 1920×1080 onboarding screen as one PNG, replying in the existing review thread. The email explains the approved story and copy, parallel motion and timing, reduced metadata, references, product boundaries, and the latest centred left block and 46/54 composition. Requested a candid verdict, five ranked concrete polish changes, elements to preserve, and an annotated screen or small mockup. No motion clip or source was attached for this screen-focused pass. Gmail confirmed message `1a1d5bec8a15be95` in SENT, thread `1a1d4e4d5cb34e6b`; a reply has not yet been checked.


## Pixel · shared-context correction request

After a first-time viewer misread the converging lines, the owner requested research, then Pixel's critique, then a revised mock. Public Roma and Slack Canvas pages were rendered and official Sim, beUI and orchestration references checked. Sent Pixel the substantive criticism, the recommended shared-project hub and an alternative single-project contribution surface. The existing graph and prior visual-only polish brief are superseded as the desired direction, but the live animation is intentionally unchanged while awaiting input.

Gmail confirmed message `1a1d5c6020eaa13c` in SENT in thread `1a1d4e4d5cb34e6b`. Readback confirmed the 334,213-byte `commons-shared-context-review.zip` attachment containing the current full screen, public reference captures and review brief. Requested a text recommendation first, with optional storyboard/visual follow-up. Sending is confirmed; no response to this new request has yet been checked.


## Shared project · Codex-led art direction

Read Pixel's shared-context response and inspected its attached screen. At the owner's request, used its workflow decisions while reworking the composition with first-party Vorflux, Composio, HEX and Anomaly references. The main illustration now has a persistent Commons project containing Codex's two notes and their mentions. Each downstream assistant and outcome aligns under the note it reads. Short independent read paths replace the converging graph and outside return loops. Two result checks register back in the project. The calendar uses Google's product mark; Instinct uses its existing official asset. The Calendar and X results are equal height on desktop. The left sign-in composition and form flow are retained. Earlier sequential/parallel studies remain accessible separately.

This is a local staged simulation, not evidence of a working Calendar/X integration, customer bookings or automatic agent waking.

Validation: inspected seven narrative phases plus a recorded normal-speed playthrough and loop boundary. Across eight viewport widths (320–1920), found no horizontal overflow, broken images or observed JavaScript errors; both desktop outcome cards have equal heights and no internal content overflow. Confirmed the same scene/clock after Continue with Google, the code-based agent entrance, completed reduced-motion frame, keyboard-focus hold and access to earlier variants. The current poster and live playthrough are `design/research/commons-launch-preview.png` and `design/research/commons-launch-loop.mp4`. A visual review found and corrected a CSS class collision with existing workspace note links before completion. A reduced-motion check initially raced the media-change event; after waiting for that event, the completed static state passed.


## Agent mentions · stronger identity

Used the owner's supplied Grok Bot screenshots as the reference for recognizable inline identities. The two onboarding request mentions now pair the existing official mark with a slightly stronger name, a quiet tinted background and distinct blue/coral identity colours. The matching downstream agent names use the same colours, helping the viewer follow each request to its recipient. Marks retain their original colours. No new interaction or motion was added. Checked 320, 390, 851, 1024, 1440 and 1920px widths: loaded marks, no horizontal or result-card overflow, and no observed JavaScript errors.


## Quieter source contribution

The owner found the layout's large Codex section too dominant. Removed the enclosing source-panel background/border, hero-sized platform statement, repeated supporting sentence and note-count status. The shared project now uses an open header and two aligned note columns, with Codex as a compact inline author/contribution. Source-note and outcome columns share the same edges. The existing identity mentions and independent read/result narrative remain. The current 1440px stage is about 105px shorter than the preceding version. Checked eight viewport widths, loaded assets and seven animation phases with no observed JavaScript errors, horizontal overflow or outcome-card content overflow.

The interface font is the locally served Geist variable Latin font (`design/assets/geist-latin.woff2`), applied to the root and inherited by controls. No typeface change was made.


## Shared context component · document hierarchy

Replaced the two separate outlined source cards with one split context surface and a quiet internal divider. Each record has a compact document identity (contacts versus project note), a brief content preview and a separated request row. Existing tinted agent mentions remain. On narrow screens the same surface stacks with a horizontal divider. The alpha preview names Aarav, Maya and Riya, plus seven more; the calendar uses matching fictional sample attendees in “Demo with Aarav Shah”, “Demo with Maya Chen” and “Demo with Riya Mehta”. No real people were fetched or meetings created.

Checked eight viewport widths (320–1920), loaded assets and seven animation states: no observed JavaScript errors, horizontal overflow or result-card content overflow. Motion timing and the three-second completed-result-to-next-activity interval are retained.


The owner increased the completed-result-to-next-activity interval to five seconds. The current shared-project loop is 17.2s, results still finish at 12.6s, the fade/reset starts at 16.4s, and the next source activity begins at 17.6s. Other motion phases retain their timing.


## Single-update experiment · larger live workflow

The owner approved trying one Codex update instead of the alpha/release source boxes, with larger type and a cleaner live workflow. Revisited the supplied HEX / Composio, Vorflux and Anomaly references. Removed the two source records and their preview metadata. Codex now types: “Commons is ready for demos. I’ve shared the product notes and 10 alpha signups.” Two unboxed, centred requests branch to the respective assistants and results. The named Calendar examples and approved X copy remain.

The source uses 20px desktop text; agent names and X body increase from 12px to 14px, mentions from 12px to 14px, and calendar entries from 11px to 13px. The stage uses more available width. Source writing runs from 0.4–2.8s before requests appear at 3.0–3.5s. Downstream work retains its pacing; the five-second completed-result-to-next-activity interval remains. Source-card highlights are absent. This is a staged local design study; no agent was woken or external action performed.

Inspected the source write, request reveal, read, work, result and reset states across eight viewport widths (320–1920). No observed JavaScript errors, horizontal overflow, broken images or outcome-card content overflow. Verified continued scene/clock after Google continuation, agent joining, keyboard-focus hold, static reduced-motion result and earlier variant access.


## Outcome identity · fewer repeated headings

Removed the separate Instinct/Grok Bot heading and activity-status rows above the outcomes at the owner's request. The Calendar card now identifies Instinct in its top-right corner in place of Friday. The post card identifies Grok Bot in its top-right corner in place of X. The X mark moves to the footer's bottom-left position, replacing Draft. The highlighted mentions above the paths still identify each request. Checked eight viewport widths and the write/read/result/reset states: no observed JavaScript errors, broken images, horizontal overflow or result-card content overflow. The animation timing and five-second restart gap are retained.


## Inline mentions · fork preview

At the owner's request, the highlighted mentions now live inside Codex's update and the separate mention/caption block is removed. Copy: “Commons is ready for launch.” then “@Instinct Book demos with the 10 alpha signups.” and “@Grok Bot Draft our launch post using the product notes.” There are no commas after either mention. The message types in reading order; each mention appears as a selected identity before its request types. Hidden sizing layers preserve the text layout and do not display duplicate mentions.

A single restrained fork starts below the whole shared update and ends at the centres of the two result cards. It does not follow the position of a word as text wraps. Its SVG geometry refits when the stage resizes. A narrow screen uses a short vertical stem and stacked outcomes. Product/output marks, Shiv/Rhea/Alex meeting titles, X footer mark, sparse sign-in column and five-second completed-result-to-next-activity interval remain.

Checked eight widths and seven representative states with no observed JavaScript errors, broken images, horizontal overflow or outcome content overflow. Confirmed no outside mention block, two visible inline request mentions, comma-free request copy and fork endpoints within one pixel of the card centres/top edges. The fork also refits after resizing. The current experiment is available live and at `?t=13.2` as a still for review.
