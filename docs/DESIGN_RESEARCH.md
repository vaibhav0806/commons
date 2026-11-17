# Commons UI research · November 13, 2026

> **Archived research.** This preserves alternatives considered before the live Mist & Lilac system. It may describe retired requests, collections, a visual Explorer, or old prototype behavior. Use [`../DESIGN.md`](../DESIGN.md) and [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) for current work.

This research informs the [dark design study](../design/v2/index.html), not an approved production UI or a library migration. Public pages and their embedded product previews were inspected at desktop size. No signed-in product experience was evaluated.

## What to take from the references

| Reference | Observed quality | Application to Commons |
| --- | --- | --- |
| [Roma](https://roma.app/) | Near-black canvas, layered dark product surfaces, compact navigation, strong typography and clear dividers | The closest visual reference. Use separate navigation, index and reading surfaces; give a document more space than its controls. |
| [Simulithic](https://www.simulithic.com/) | A light interface with precise structure and a coherent visual sequence explaining the product | Borrow alignment and narrative clarity. Its visual theme is light, so it is not evidence for a dark palette. |
| [beUI](https://beui.dev/) | Dark component presentation, clear type and visible interaction motion | Treat motion as part of the component contract. Do not assemble unrelated effects into the application. |
| [Vercel Geist](https://vercel.com/geist/introduction) and [color scale](https://vercel.com/geist/colors) | Explicit background, component, border and foreground roles; consistent type and density | Separate semantic surface levels, draw boundaries once, and reserve strong contrast for content and important actions. |

The first study’s weakness was structural as well as visual: repeated rounded note cards gave most content the same weight. Simply reversing its colors would preserve that problem. Study 02 uses a compact index and a document pane, with requests as a temporary adjacent layer.

## Useful OSS resources

| Resource | Useful for | Limit |
| --- | --- | --- |
| [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines) | Reviewing semantics, focus, forms, keyboard behavior, reduced motion and animation performance | An engineering checklist cannot choose a distinctive composition. |
| [Impeccable](https://github.com/pbakaus/impeccable) | Documenting a direction and applying focused critique, audit and polish passes | Its checks do not establish visual quality or product fit. Its current README distinguishes product context from design documentation. |
| [Unslop](https://github.com/heydamir/unslop) | Inspecting existing UI in deliberate passes: hierarchy, spacing, typography, details and motion | Useful critique vocabulary, not a guaranteed automatic redesign. This may be near the tool name recalled in conversation; the exact intended name is unconfirmed. |
| [UI Skills](https://github.com/ibelick/ui-skills) | UI and motion engineering guidance; a reference catalogue for specific interaction problems | Choose advice relevant to the interaction rather than installing every available rule. |
| [Base UI](https://base-ui.com/react/overview/about) and [coss UI](https://github.com/cosscom/ui) | Accessible interaction primitives and a restrained component vocabulary for the future application | Neither supplies the entire Commons information hierarchy, product behavior or identity. |

These repositories were researched; Impeccable, Unslop and UI Skills were not installed or run as audits. The installed frontend-design and motion-director skills informed this revision. No third-party component code or paid asset is required by the static study.

## Practical workflow for this project

1. Inspect real rendered references and identify specific qualities to reuse.
2. Record one coherent direction, token vocabulary and motion contract.
3. Build the connected flow with realistic content and inspect it at desktop and mobile sizes.
4. Exercise forms, keyboard paths, errors, intermediate animation frames and reduced motion.
5. Review the visible result with the owner before implementing the production UI.

Keep the proposed production primitives unless an interaction reveals a concrete limitation. The static prototype uses native HTML, CSS and Web Animations to make this review fast and independent of the unfinished application scaffold. A production React version can reproduce the same motion contract with CSS or Motion; a library choice alone will not improve the design.

## What changed in Study 02

- Charcoal surface hierarchy, self-hosted Geist Variable, restrained amber for scope/context, and quiet participant colors.
- A note index and readable document pane in place of equally weighted large cards.
- Human onboarding, scoped code generation, agent-led joining and explicit success/error states.
- Request creation with attached source context, keyboard mentions, persistence and a separate acknowledgement/completion sequence.
- Actual entrance, panel, code, mention and confirmation animations; replayable motion examples and a reduced-motion alternative.

The dark direction is a proposal for review. Research and prototype checks do not verify authentication, authorization, MCP interoperability, provider compatibility, or agent return behavior.


## Workspace simplification · following owner review

The owner preferred the dark visual direction but found the main layout too busy. A permanent index and reader, duplicated navigation, and small authorship metadata obscured what the product does. The next revision changes the workspace hierarchy while retaining the dark foundations and onboarding.

[Todoist’s public product preview](https://www.todoist.com/), [project guide](https://www.todoist.com/help/todoist/features/introduction-to-projects-TLTjNftLM), [section guide](https://www.todoist.com/help/todoist/features/introduction-to-sections-rOrK0aEn), and [task-context guide](https://www.todoist.com/help/todoist/features/add-comments-or-files-to-tasks-in-todoist-CwiA50) informed the revision. Their relevant pattern is a focused project, grouped lists, and context opened on demand. The public preview was inspected; a signed-in Todoist account was not accessed.

For Commons, the two visible project sections are **Requests** and **Notes**. An open request reads “Atlas asked Sage”; a note reads “Note by Sage”. Selecting an item reveals the full content. Request details name the requester and recipient separately and show the attached source note. Completed requests are collapsed, with an example result note available when expanded. The sample’s prior acknowledgements and results are fictional historical data, not simulated live agent work.

This borrows Todoist’s restraint, rather than adding its dates, priorities, labels, boards, or a click-to-complete control that would blur acknowledgement with completion. A request remains an asynchronous ask, and a note remains durable shared context. A context note is optional when creating a request and preselected when the request starts from a note.


## Onboarding and identity refinement

The owner’s latest feedback keeps the workspace layout and focuses this pass on onboarding. The revised example uses real product names and marks, neutral controls and a concrete build-to-X-drafts handoff.

The public pages of [beUI](https://beui.dev/), [Simulithic](https://www.simulithic.com/), [Roma](https://roma.app/), [Conductor](https://www.conductor.build/) and [Executor](https://executor.sh/) were revisited. Conductor and Executor were also inspected as rendered desktop pages. Conductor’s public page uses a bright blue illustrated hero with a light product preview; Executor uses light surfaces, strong type and recognizable app/agent marks. They are references for identity and visual explanation rather than evidence that everything should be dark. No signed-in account was accessed.

The owner accepted the overall start-page composition for this pass, so it remains dark while the amber styling is removed. The stronger change is explanatory: Codex’s build note becomes context for Claude Code’s request, then Grok Bot’s X drafts. The example loops independently of the active form, preserving its DOM node and animation objects between steps. [Asset provenance](../design/assets/brands/SOURCES.md) distinguishes vendor-hosted marks from the Codex mark obtained from Executor’s product examples.


## Motion revision · connected work, not animation chrome

The owner’s Wajo screenshot is a reference for a later workspace pass; the current task changes only onboarding motion. The Roma screenshot points to a specific mechanism: separate agent contributions are visibly connected, and the connecting path helps explain how those contributions belong to the same work.

The public [Roma page](https://roma.app/) was reviewed from hero through product workspace, collaboration, decision history, recurring work and connections. Its useful pattern is continuity across product states, with paths connecting meaningful records and actors. The [Simulithic page](https://www.simulithic.com/) was inspected through its device, mapping and delivery sequences: the motion depicts a concrete action and its result. These are visual observations, not measurements of either product’s usability or a claim of their integration compatibility.

A current YC reference was also checked: [Spacesheep](https://www.ycombinator.com/companies/spacesheep), listed in Fall 2026. Its [public product page](https://spacesheep.dev/) leads with a populated product surface demonstrating an output. The YC listings for [ProjectX](https://www.ycombinator.com/companies/projectx) were reviewed for context, without drawing motion conclusions from its directory description.

Applied to Commons: the note, request and draft surfaces stay present; motion follows the shared context between agent identities; the result arrives in about six seconds; the complete loop takes twelve seconds. The pause button, presentation heading, timeline bar and “example workflow” label were removed. The surrounding prototype still identifies itself as a local demo. This remains a staged product scenario, not a recording of external agents or a claim that Commons executes them.


## Launch handoff research and direction · 13 November 2026

The owner clarified that cards, chips, status changes and typing are welcome. The issue is their composition and craft, not their presence. The research and proposed direction were shown in conversation before changing the prototype. This pass is limited to the isolated onboarding illustration; the human setup forms and production application are outside it.

### What was inspected live

Public desktop pages were rendered in an independent browser, with multiple frames captured across the visible sequences. No account or private Chrome profile was used. These observations assess visual explanation, not conversion, usability test results or verified agent interoperability. The public pages do not establish whether their authors used AI to make them.

| Source | Concrete observation | Application |
| --- | --- | --- |
| [Roma](https://roma.app/) · [captured task composition](../design/research/roma-tasks.png) · [shared launch task](../design/research/roma-shared-work.png) | Product labels above cards, titles before descriptions, small filled pills and continuous paths. The shared dinner example shows complementary contributions to one task. | Keep recognizable actors and useful status detail. Use a shared launch, not a collection of unrelated errands. Borrow the hierarchy, not the orange glow or task-execution claims. |
| [Simulithic](https://www.simulithic.com/) · [captured mapping sequence](../design/research/simulithic-map.png) | A command establishes the action; a connected map becomes the result. A consistent visual language ties the changing states together. | Show what context moves and what it becomes. Keep the framing stable. |
| [Sim Workflows](https://www.sim.ai/workflows) | Connected blocks have concrete action names: enrich a lead, score company fit; another example finds documents and drafts a reply. | Make the causal order legible. A Commons diagram illustrates contributed records, not an execution graph. |
| [Gumloop](https://www.gumloop.com/) · [captured result](../design/research/gumloop-result.png) | A specific churn question leads through named source activity to a readable recommendation. The result has more visual weight than the supporting metadata. | The final post should be a recognizable, readable artifact, not a completion badge. |
| [beUI agent components](https://beui.dev/components/agents) and [motion guide](https://beui.dev/docs/motion-patterns) | Task state, activity and streaming are separate component responsibilities. Its guide defines motion by purpose and uses shared tokens and reduced-motion alternatives. | Use consistent card anatomy and timing. Let one meaningful action lead at a time. |

[Relay's current page](https://relay.app/) reports that it shut down in September 2026; it was excluded as a current product reference. [Vercel's guidelines](https://vercel.com/design/guidelines) and [Motion's layout documentation](https://motion.dev/docs/react-layout-animations) were reviewed as implementation references. Neither chooses a visual composition for us.

### Chosen composition

Two attributed contribution cards span the right pane. A compact human request appears on the connecting path. A larger Grok Bot post draft sits below, as the visual payoff. There is no enclosing dashboard card or separate agent rail. Codex and Instinct have equal source weight; Grok Bot's result is the dominant object.

The considered alternatives were Pixel's three equal top cards (adds a whole card for a one-line human instruction) and the earlier two-agent desk (clearer but loses the personal-assistant contribution the owner wants). Two sources plus a compact request retains the actors while making more room for the result. This was Codex's design choice, not a separately approved specification.

### Illustrative copy and causality

- Codex shares the first build: shared notes and agent invites.
- Instinct shares a launch update: ten early users confirmed for Friday demos.
- The human asks Grok Bot to make a launch post, with these notes attached.
- Grok Bot's draft explicitly includes the first version, ten demos and Friday. Both sources visibly matter.

All figures, bookings, work states and post text are staged copy. This is not evidence of shipped production features, actual customers or live agents. The draft is never published. The diagram represents agents contributing and reading records, not Commons waking or operating agents. The surrounding study retains its local-demo disclosure.

### Motion contract

A 14-second automatic loop: build note settles during the first second; Instinct's confirmation count resolves by about 2.2 seconds; the human request appears and the context traces travel into the draft; Grok Bot types from about 3.1 to 6.2 seconds; the completed draft remains readable to about 12.6 seconds; the result fades for reset. The surfaces remain present.

The scene and its clock remain mounted through every onboarding form. Keyboard focus holds the scene without a visible playback button. Reduced motion shows the complete outcome. Mobile places the same explanation after the form, with the source cards stacked, rather than hiding it. Developer-only `?t=8` and `?reduced=1` allow repeatable frame inspection; no timeline or playback controls appear in the product illustration.

The prototype keeps its existing DOM, CSS, SVG and Web Animations foundation. A small clock-driven text renderer supplies typing and the discrete count; a new animation dependency is unnecessary. Timing values here are authored choices, not measurements copied from the reference products.


### Preview and verification

[Open the running study](http://localhost:4177/v2/?flow=5#/start) · [representative result](../design/research/commons-launch-preview.png) · [one recorded loop](../design/research/commons-launch-loop.mp4).

Checked seven viewport widths from 320 to 1920, the seven opening/handoff/typing/result/reset states, image loading, the full onboarding route chain, preserved story/clock identity, keyboard hold and OS reduced motion. A normal-speed recorded playthrough confirmed 172 draft characters at about 6.5 seconds, a held result at 12 seconds, a dimmed Post during reset and a cleared draft in the next cycle. At 320px the full draft fits its reserved body height. No observed JavaScript errors or horizontal overflow. These checks do not certify accessibility or external-agent compatibility. The visual direction remains subject to owner review.


### Follow-up: readability and collaboration balance

Owner feedback supersedes the earlier 14-second timing and dominant draft sizing. The current prototype uses a 26-second sequence with distinct reading pauses after Codex and Instinct, Codex heading/body typing and a 105-character X draft. The result card occupies roughly half its previous desktop area. The source contributions stay visible and carry more weight. The actual owner-requested X avatar replaces the generic silhouette. Use `?t=20` for the current hold frame; the preview image and recorded loop linked above are updated to this pass.


### Parallel and sequential comparison

The latest comparison supersedes the 26-second pacing. The current scene runs in 16 seconds with simultaneous Codex/Instinct work and completion; the alternate runs in 18 seconds and stages exactly one agent at a time. The content, avatar, source/result hierarchy and underlying participation boundary are retained. The change answers the owner's new hypothesis about rhythm rather than adding new researched product capabilities.

[Compare both live](http://localhost:4178/compare.html), or open the [parallel](http://localhost:4177/v2/?flow=7#/start) and [sequential](http://localhost:4178/sequential/?flow=7#/start) full onboarding separately. Earlier recordings linked above document the preceding pacing pass; the live comparison is the current review surface.

Current comparison artifacts: [representative side-by-side frame](../design/research/commons-animation-comparison.png) and [recorded playthrough of both variants](../design/research/commons-animation-comparison.mp4). Live replay reset the two clocks to within one rendered frame; inspected phases confirmed synchronized source completion in parallel and exclusive actor visibility in the alternate.


## Shared-context narrative correction · 13 November 2026

A first-time viewer read the existing Codex + Instinct → Grok Bot connectors literally, and could not explain why booked demos were an input to the launch post. The owner clarified the intended story: Codex adds the release summary and ten existing alpha signups to Commons; Instinct reads the signup list to book demos in the owner's calendar; Grok Bot independently reads the summary to prepare the launch post. Both leave results in the shared project. Instinct is not generating leads. This feedback supersedes the earlier narrative in which both source notes fed the X draft.

### Research before requesting Pixel's review

- [Roma's public collaboration example](https://roma.app/) was inspected in a rendered browser. Several attributed contributions belong to one visibly persistent task. [Its concepts](https://roma.app/developers/concepts) describe durable lists and items. The useful visual principle is a shared artifact that keeps its identity, rather than implying every contributor sends to the terminal agent. Roma's orchestration/waking claims are not Commons capabilities.
- [Slack Canvas](https://slack.com/features/canvas) was inspected in a rendered browser and its official page read. Shared knowledge and resources have a persistent surface. Borrow that spatial anchor; a chat feed, dashboard chrome and Slack automation are not required.
- [Sim Workflows](https://www.sim.ai/workflows) explicitly represents executable workflows. Its connected blocks are useful evidence of why viewers infer execution or a dependency from a line. That inference is a design judgment, not a measured usability result.
- [beUI's motion guide](https://beui.dev/docs/motion-patterns) describes purposeful reveal, continuity of surfaces and designed reduced-motion states. These support maintaining a recognisable note through write/read/result stages, rather than adding decorative travelling dots.
- [Microsoft's orchestration definitions](https://learn.microsoft.com/en-us/agent-framework/workflows/orchestrations/) distinguish sequential, concurrent and control-handoff patterns. Used to cross-check the meaning of the diagram, not to propose an orchestration SDK for Commons.

### Directions sent for critique, not yet implemented

**A — persistent project hub, recommended:** Codex adds two named records to a compact visible Commons project. Instinct reads the alpha signups and Grok Bot reads the release summary. Their independent calendar and X results have comparable visual weight. Both can work in parallel after the source exists. No Instinct-to-Grok Bot connector. A circle/triangle is optional; it must not imply endless forwarding.

**B — one project, three attributed visits:** one project surface receives Codex's records, then shows Instinct and Grok Bot using the relevant records and saving their outcomes. Stronger persistence cue and no network graph, but risks chat-like density or a miniature dashboard.

Preserve the centred sparse sign-in column, 46/54 desktop split, dark tokens, official agent marks, readable motion, continuing scene clock, static reduced-motion state and local-demo disclosure. A calendar mark represents the assistant's illustrative external result; it does not certify a Commons Google Calendar integration. A mention does not wake an agent. The new mock is awaiting Pixel's requested recommendation.


## Studio references · shared-project composition

The owner asked Codex to use Pixel's workflow decisions while taking responsibility for a more ordered design. Read Pixel's latest email (`1a1d5dc459d8381c`) and inspected its 1440px frame. The retained decisions are two persistent Codex notes with separate mentions, independent reads by Instinct/Grok Bot, separate calendar/post outcomes and results saved back. The new design does not copy Pixel's outside loop connectors, four-row project index, placeholder Instinct mark or dense ten-time-slot calendar.

All four supplied reference sites were opened and rendered in an independent browser: [Vorflux](https://vorflux.com/), [Composio](https://composio.dev/), [HEX](https://hex.inc/), [Anomaly](https://anoma.ly/). Relevant first-party HEX case studies were read; Composio, AgentMail and Attio were also rendered. [OpenCode](https://opencode.ai/), linked by Anomaly as its creation, was inspected as a relevant product surface. These are visual observations and design interpretations, not conversion evidence or verified Commons compatibility.

| Reference | Useful principle | Commons application |
| --- | --- | --- |
| Vorflux | A product frame creates a strong focal region; alignment and quiet spacing keep dense contents legible. | One persistent project panel replaces scattered source objects. |
| Composio and [HEX's case study](https://hex.inc/work/composio) | HEX describes reducing system maps to one or two ideas and imposing structure with a grid. | Two source notes, two matching readers, two independent results. No cross-agent AND-join. Its energy artwork is not copied into Commons. |
| [HEX / AgentMail](https://hex.inc/work/agentmail) | The brand uses a product-specific metaphor and sequences the story through consistent parts. | Commons is visibly a place that holds notes, rather than a logo-only routing hub. |
| [HEX / Attio](https://hex.inc/work/attio) | Product surfaces were used to test a coherent visual language. | The same matte surfaces, borders, type hierarchy and spacing tie source notes and outcomes together. |
| Anomaly / OpenCode | Large clear hierarchy, limited competing elements, disciplined framing and practical product views. | Restrained monochrome composition; the animation's information determines the layout. |

### Implemented sequence

- 0.4–1.7s: Codex types the platform-ready statement inside the Commons project.
- 2.5–3.4s: alpha signups and release summary appear and save, each with its own directed request.
- 4.5–6.5s: Instinct reads the signup note and Grok Bot reads the summary. Two short aligned stems show these separate reads.
- 6.4–7.5s: the calendar and X artifacts appear, slightly staggered to direct attention.
- 7.5–12.6s: bookings accumulate and the launch post types. Both complete at 12.6s.
- 12.6–14.4s: results register back on their respective project notes and remain readable.
- 14.4–15.0s: contributions fade for replay while the project header/frame persist. The next source activity starts at 15.6s, three seconds after completion.

The 15.2s loop is native DOM/CSS/SVG with one clock and explicit seek/reduced-motion states. The source notes remain identifiable throughout. No line connects Instinct to Grok Bot. A Google-hosted Calendar mark identifies the illustrative external artifact; Commons does not perform that action. The approved X copy, actual owner avatar and centred sparse sign-in column are retained. All bookings, notes and agent work are staged local-demo content.


## Single-update experiment

The owner approved removing both source boxes and increasing legibility. Revisited the first-party HEX / Composio, Vorflux and Anomaly references before implementation. Applied their visual principles to a new unboxed contribution: one Codex statement, two directed mentions, two outcomes. Source panels and their preview metadata are removed rather than merely restyled. The statement names the shared context so removing the cards does not erase causality.

The larger stage uses 20px message text, 14px agent labels and X copy, 13px request/calendar text and 27px marks at the main desktop size. The existing brand palette, local Geist font and official marks remain. The Codex update types before requests appear; both assistants then use their own relevant input. The existing named calendar examples, launch copy and five-second restart interval remain. These are design judgments for review, not evidence from another user test.

## Palette/material review and Toolcraft · 2026-11-14

The owner confirmed a dark-only, minimal composition with cybernetic/neofuturistic character across the interface: layered surfaces, controlled reflection, fine geometry and responsive hover/press/state changes. Typography is approved separately: Space Grotesk headings, Geist reading/controls and Geist Mono identifiers; Sora remains the stored alternate. After reviewing the palette study, the owner selected **Graphite + Reflective**. Type scale, geometry and the remaining component/motion rules remain under review.

The [palette study](http://localhost:4177/typography/?study=materials) reuses the typography study's project page and behavior. Graphite, Ice blue and Iridescent remap the same semantic roles; matte and reflective are separate choices for every palette. Reflective treatment adds a thin pointer-responsive edge and button highlight. It does not animate a colored fill across the note. The control sample demonstrates focus, invalid input, pending, success and disabled states. This is a review artifact, not an approved system rollout or live product operation.

### Toolcraft assessment

Read the [repository README](https://github.com/pixel-point/toolcraft), [starter package](https://github.com/pixel-point/toolcraft/blob/main/starter/package.json), [MIT license](https://github.com/pixel-point/toolcraft/blob/main/LICENSE.md) and the first-party example descriptions below. Toolcraft provides a custom design-app starter with a canvas, controls, optional timeline/keyframes and image/video export workflows. Its starter uses React, Vite, TanStack Router, Tailwind and Base UI; adopting its whole app would be a different application foundation from the proposed Commons Next.js product.

| Example | Documented capability | Potential Commons use, not yet implemented |
| --- | --- | --- |
| [Liquid Metal](https://toolcraft.sh/gallery/liquid-metal) | Reflective 3D surfaces, animated metal and controlled environment lighting | Develop reusable chrome/reflective brand artwork and lighting studies |
| [Mesh FX](https://toolcraft.sh/gallery/mesh-fx) | Halftone, dithering, ASCII and pixel treatments on rendered 3D objects | Explore particulate and digital-object imagery related to the owner's references |
| [Dither Lab](https://toolcraft.sh/gallery/dither-lab) | Image reconstruction with dither, pixel, ASCII, halftone and grid treatments | Establish repeatable treatments for approved source artwork |

Recommendation: use Toolcraft as a separate asset/motion lab if repeatable artwork generation becomes useful. Commons' tokens, interaction rules and application components should remain under its own design system. Toolcraft is not installed or incorporated into this review page. No compatibility, performance or export-quality claim has been established by running its apps; this assessment is based on the linked source and documentation.


## Approved-system rollout · 2026-11-14

The active isolated mock now consumes `design/commons.system.css`; the approved reference imports the same foundation. `design/v2/system.css` maps existing screens to the approved Graphite palette, Space Grotesk/Geist/Geist Mono roles, spacing, geometry, reflective surfaces and motion durations. Forms, navigation, details, dialogs, requests and mentions share those rules. Production `src/` is outside this change.

The reviewed onboarding story retains its copy, layout, identity tints and timeline. Its native Calendar/X artifacts retain their illustrative scale and branding. Ordinary UI uses 140ms response, 260ms surface movement and a single 500ms primary-control glint. Reduced motion removes movement and pointer tracking. Field focus changes the existing border only, with invalid fields retaining the error border. The Impeccable detector's font warnings conflict with the owner's explicit approved pairing and were intentionally retained; material-light and compact agent-identity color exceptions are recorded in DESIGN.md.

Validation is recorded in `design/README.md`. Toolcraft remains a separately assessed asset/motion-lab option; it has not been installed or incorporated.
