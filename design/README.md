# Commons design studies

Historical prototypes and visual references. The running product is the Next.js app at `http://localhost:3007`. Old study URLs below require their own static server and do not represent active product routes. `commons.system.css` and its referenced font assets are shared with the app.

**Approved design system: [Project, states and foundations](http://localhost:4177/typography/?study=system).** Typography, Graphite + Reflective, type scale, spacing, corners and interaction response are approved. Text fields use border-only focus, with no outer outline, ring, glow or added shadow. [`DESIGN.md`](../DESIGN.md) records the system; `PRODUCT.md` records confirmed product context. The approved system is now applied throughout the [active mock](http://localhost:4177/v2/#/start).

**Approved palette/material: [Graphite + Reflective](http://localhost:4177/typography/?study=materials&palette=graphite&material=reflective).** The study retains Ice blue, Iridescent and Matte for comparison. It demonstrates pointer-responsive edge light, button press feedback, and a control sample with focus, validation, pending, success and disabled states. The active mock uses the approved Graphite + Reflective treatment. Palette and material previews are shareable through the page URL.

**Typography comparison: [Geist, Space Grotesk and Sora](http://localhost:4177/typography/).** Approved pairing: **Space Grotesk headings, Geist body and controls, Geist Mono identifiers**. **Sora is retained as the alternate family**, including the whole-interface preview, rather than an automatic fallback. The isolated study defaults to the approved pairing; switch the heading font or apply it to reading and controls as well. The consolidated system is approved and applied to the active mock. Font assets and OFL licenses are under `typography/fonts/`. The decision is recorded in the [design system](../docs/DESIGN_SYSTEM_V2.md#approved-typography--2026-11-14).

**Latest: [inline-mention onboarding](http://localhost:4177/v2/?flow=31#/start).**

Codex types one shared update with two highlighted inline requests, without commas after the mentions. Instinct is asked to book demos with ten alpha signups; Grok Bot is asked to draft a launch post using the product notes. The former separate mention/caption block is removed. A thin fork beneath the whole message leads to the two result cards and refits with the stage. There is one visible mention per request. The outcome cards identify their contributing agents at top right; X is at the post footer's bottom left. Demo attendees are the fictional Shiv, Rhea and Alex.

Both results finish at 12.6 seconds in a 17.2-second loop, with five seconds until source work resumes at 17.6 seconds. Keyboard focus holds the scene, reduced motion shows the result, and the same scene/clock persists through onboarding. Use `?t=13.2` for a still showing the fork. This remains a local simulation.

Earlier studies: [parallel](http://localhost:4177/v2/?variant=parallel#/start), [sequential](http://localhost:4178/sequential/#/start), and [their comparison](http://localhost:4178/compare.html). These preserve the earlier narrative for reference. All agent work and external artifacts are illustrative local simulation.

The main workspace remains one project column with Requests and Notes, clear authorship and details on selection. Human onboarding separates workspace naming and first-project creation. Review the [design system](../docs/DESIGN_SYSTEM_V2.md) and [reference research](../docs/DESIGN_RESEARCH.md).

Study 02 files are isolated in `v2/`. `commons.system.css` is the approved shared foundation used by the active mock and system reference; `v2/system.css` applies its component rules. `v2/style.css` retains the historical styles and reviewed onboarding motion rules; `v2/app.js` provides the sample flow and explicit per-variant timing. `sequential/index.html` selects the alternate scene and `sequential/style.css` stages the cards one at a time. This onboarding revision uses a separate local-state key, leaving earlier demo data intact. Brand assets and their provenance are under `assets/brands/`. The Google sign-in button does not contact Google. Browser local state is independent between studies.

An isolated, interactive prototype for the [Commons design system](../docs/DESIGN_SYSTEM.md). It covers agent joining, project notes and a request with mentions, plus a live component/token reference.

## Open locally

From the repository root:

```sh
python3 -m http.server 4177 --bind 127.0.0.1 --directory design
```

Visit `http://localhost:4177`. Use the review bar to switch between Join, Project, Request and System. The sample connection code is **482193**. Reset restores the sample workspace.

The prototype runs without installing dependencies or supplying credentials. Its font and Phosphor icon assets are local; their licenses are included in `assets/`.

For the alternate and comparison, run a second lightweight server in another terminal:

```sh
python3 -m http.server 4178 --bind 127.0.0.1 --directory design
```

Open `http://localhost:4178/compare.html`. The comparison's left illustration uses port 4177 and its right illustration uses port 4178. Each pane's Full onboarding link opens the complete flow. `?preview=1` is the animation-only review surface, and `?t=11.2` / `?t=14` seek to the parallel/sequential completed frames. Reduced motion shows all completed contributions statically in either variant.

## Try the flow

1. Open Join, enter the sample code and choose an agent name.
2. Read the project brief and pinned note; open a linked reference.
3. Publish a note or choose **Create request** on a note.
4. Select eligible recipients in the mention picker, add context and create the request.
5. Open Requests or Catch up to inspect the handoff and reported status.

## Boundaries

All workspace content is clearly labelled sample data. Changes persist only in this browser's local storage. No agents are connected, messages sent, permissions enforced by a server, or authentication/MCP endpoints exercised. The sample code is not a credential for a real workspace.

`commons.tokens.css` is the token source, `commons.css` defines the reusable visual components, and `prototype.js` supplies sample content and local interactions. The existing application under `src/` is unchanged.

## Study 02 verification

Approved-system rollout: checked all fourteen active routes at 1440, 768, 390 and 320px with no observed horizontal overflow, broken images, JavaScript errors or HTTP errors. Walked the connected owner/agent onboarding with invalid-input recovery and workspace-scoped joining; confirmed the same story node and animation clock survive setup. Walked note publishing, keyboard recipient selection, source attachment, request persistence, acknowledgement and completion. Checked detail focus containment, Escape dismissal, border-only focused/error fields, pending `aria-busy`, button keyboard focus and reduced-motion behavior. The four onboarding renderer/clock functions are byte-for-byte unchanged from the pre-rollout baseline. Inspected desktop and mobile renders; Calendar/X artifact typography and story timing remain deliberate exceptions to ordinary UI component sizing. These remain local prototype checks, not production integration or accessibility certification.

Current single-update revision: inspected opening, first write, saved notes, separate reads, drafting/booking, completed results and replay. Recorded a 19.96s live playthrough including the loop seam (1440×900, 25fps, H.264 MP4, 253,391 bytes). Checked eight viewport widths from 320 to 1920: no horizontal overflow, broken images or observed JavaScript errors. Calendar/X cards retain equal desktop heights with no internal content overflow. Verified scene and clock continuity after Google continuation, the agent entrance, static reduced-motion results, keyboard-focus hold and earlier variant access. The runtime loop is 17.2s; the live capture includes page startup and the next activity. These checks do not establish production integration or a first-time viewer’s comprehension.

Previous motion revision: verified the parallel sources both report Shared and the demo count reaches ten at 3.5 seconds; both source outlines complete together and feed the merged trace at 3.5–5.2 seconds before Grok Bot drafts at 6.7–10.5 seconds. In the alternate, computed visibility and captured frames confirm exactly one actor at the inspected Codex, Instinct, transition and Grok Bot phases. Both variants were checked at seven viewport widths (320–1920), with images loaded and no observed JavaScript errors or horizontal overflow. The scene/clock persist through onboarding, and reduced motion shows the complete context. The comparison page renders both real local origins and its replay control resets their clocks together.

Earlier pacing and visual review history follows.

Onboarding revision: checked separate workspace/project forms, the editable demo-profile default, validation/recovery, back navigation, both scope choices, code instructions and agent joining. The same story DOM node, CSS animation object and start time were preserved across all six transitions from sign-in to joining confirmation. The former pause/play controls have been replaced by keyboard-focus hold. A fully visible reduced-motion alternative and all four local brand assets are retained. Nine views were checked at 1440px, 1024px, 768px, 390px and 320px with no observed JavaScript errors or horizontal overflow. Representative build, context, draft and reset frames were inspected; the previous 18-second sequence was replaced by the faster connected 12-second product flow.

Earlier workspace checks covered note publishing, keyboard mentions/removal, optional attached-source requests, local persistence, read position, acknowledgement/completion, completed-handoff/result-note navigation, focus restoration and filtered personal requests/unread notes. Fifteen routes were checked at 1440px, 768px, 390px and 320px in that revision. The current pass changes the theme and identities but retains that layout.

Named neutral text/background pairs retain the earlier 4.81:1–16.16:1 range. These checks do not certify complete accessibility or agent integrations. The design remains a prototype for review.

## Study 01 review checks

Checked the join/error-recovery flow, note publishing and filtering, keyboard mention selection, context attachment, request creation/persistence, and acknowledgement separate from completion. All four views were checked at 1440px, 768px and 390px with no horizontal overflow or observed JavaScript errors. Named text/background token pairs meet a 4.5:1 contrast minimum. These are prototype checks, not certification of production accessibility or agent interoperability.
