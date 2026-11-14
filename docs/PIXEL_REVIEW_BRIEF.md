# Commons: onboarding animation review for Pixel

Date: 13 November 2026
Requested by: Vaibhav
Prepared by: Codex, on Vaibhav’s behalf
Immediate scope: the right-hand onboarding animation

Hi Pixel,

Vaibhav asked me to bring you into the design review. We have iterated on Commons several times. The prototype works as a study, but the onboarding illustration still does not communicate the product with enough clarity or visual confidence. Please give us a candid design critique and a concrete, visible direction. Do not just polish the current nested cards.

Please actually inspect the screenshots and motion clip in the attached review packet. You may open the public reference URLs and inspect the included source. The packet includes a self-contained HTML preview that you can open in your own browser, the original source as a readable Markdown document, the PRD and design notes. The live preview is on Vaibhav’s laptop; its localhost address is not accessible from your computer.

## Inside the attached commons-pixel-review-packet.zip

- `01-current-landing-desktop.png` and `02-current-landing-wide.png`: the complete page at 1440×900 and 1920×1080. The wide view makes the unused right-hand space particularly clear.
- `03-build-note.png` through `06-x-drafts.png`: the current illustration at four meaningful moments, with the right pane included.
- `current-onboarding-loop.mp4`: one complete current loop, so you can judge pacing rather than infer motion from stills.
- `07-current-workspace-context.png`: product context only, not a request to redesign the workspace now.
- `08-reference-roma-connected-tasks.png`: Vaibhav’s supplied public-product reference.
- `commons-preview.html`: a self-contained working preview with the code, fonts and logos embedded. Open it in your own browser; no installation is needed. `commons-prototype-source.md` contains the original files for inspection. Start with `README-REVIEW.md` for context.
- `commons-pixel-review-brief.md`: this full request as a standalone document.

## 1. What Commons is

Commons is an open-source shared workspace for the independent AI assistants a person already uses. A coding assistant knows what someone built; a browser/personal assistant needs that context to do research, write launch copy, or continue a different part of the work. Today the human copies context between separate chats. Commons gives the notes, references and next steps a common home.

- The core is participation: shared context, durable notes, requests and mentions. Execution stays in each assistant’s existing product. Commons does not launch coding agents or run their computers.
- Compatible clients can participate through MCP; browser-operated assistants can use the web app. Both entrances are intended to use the same records and permissions. Actual provider compatibility is not certified by this prototype.
- A human signs in with Google, names a workspace and creates a project. The human generates a six-digit connection code and chooses access to the whole workspace or one project.
- The agent redeems the code and names itself. The human does not create or name its agent profile. There is no second owner approval after redemption.
- One registered agent belongs to one workspace. A workspace can contain several projects.
- Notes hold findings, decisions and source context. A request identifies who is asking, who should respond, the next step and optional source notes. Reading, acknowledging and completing are separate.
- Collaboration is asynchronous. A mention or saved request does not itself wake an agent or guarantee that it returns. A generated social post is a draft for human review, not an automatically published post.

The immediate use case is specific: Vaibhav builds a product in Codex or Claude Code, leaves the useful build context in Commons, and his Grok Bot can use it to draft X posts. The explanation should be understandable at a glance.

## 2. The current study and what to preserve

This is an isolated HTML/CSS/JavaScript prototype, not the production application. Google sign-in, codes, agents and content are simulated. The surrounding study bar labels it a local demo. Product documents were reviewed before implementation; production UI/auth/database/MCP work remains outside this design pass.

The current left-hand onboarding is acceptable for this pass: Continue with Google → editable workspace name prefilled from a demo Google profile, such as “Vaibhav’s workspace” → a separate first-project step → choose project/whole-workspace access → generate a code → copy agent instructions. An agent has its own code-and-name entrance.

Retain that flow and the current dark foundation. Buttons are generally fine. Do not restart the product architecture or turn this into a chatbot landing page. Focus your creative effort on the illustration on the right.

The assets are local. The study uses Geist Variable and native CSS/SVG/Web Animations. There is no need to add another framework just to critique or mock up a direction. The proposed production stack is Next.js/React/TypeScript, with Tailwind/shadcn-style primitives; the attached technical decisions are context, not a request to implement the backend.

## 3. All design feedback so far, in sequence

- **First light study:** clean, but very generic. Repeated soft note cards and an undifferentiated layout did not establish a distinctive product identity. Vaibhav wanted a dark direction and actual interaction/onboarding motion, informed by real products rather than an arbitrary component catalogue.
- **Reference direction:** beUI, Simulithic and Roma were the original references. Conductor, Executor, Vercel/quality OSS, and current YC products were also requested as research references. The goal is considered product UI and convincing visual explanation, not copying every effect or changing the stack because a library is fashionable.
- **First dark workspace:** visually better, but too much was happening. The navigation, tabs, note index, reader and request panel made it hard to understand what Commons does, what a note or request is, who raised the request, who should act, and how agents collaborate.
- **Simpler workspace:** Todoist became the layout reference. We moved to one project content column with Requests and Notes, plain “Codex asked Grok Bot” / “Note by …” attribution, on-demand details, and collapsed completed work. Keep this as background context; the workspace is not today’s redesign target.
- **Color and identity:** the yellow/amber accent on dark backgrounds was disliked. So were the yellow textbox outline, boxed “Project access” / “Acknowledged” badges, and colored initial avatars. Neutral field focus, plain scope/status text, and real product names/logos were preferred. Sage/Atlas/Mira-style fictional agent names were explicitly rejected.
- **A real story:** “The first useful session” and generic onboarding copy were not a convincing agent use case. The requested story was a build-to-marketing handoff: development context from Codex/Claude Code becomes useful input for Grok Bot’s X drafts. Actual agent marks should make the participants recognizable.
- **Onboarding continuity:** the right-hand illustration must not restart when Continue with Google or a setup step is used. Workspace naming and first-project creation were split into separate steps. The workspace name should start from the Google profile name and remain editable. The scoped connection-code and copy-instructions steps were liked.
- **First repeated illustration:** it was better, but too plain and slow. Very little happened for long stretches. A loading/timeline bar only signaled that this was an animation. The visible Pause button and “Example workflow” label felt like presentation chrome. Vaibhav asked for automatic, flowing motion that looks like useful work in the product, without explaining that it is an animation. Reduced-motion support can remain unobtrusive.
- **Latest implementation:** the 12-second loop now shows a build note, a document token moving along an agent rail, an attached request, reading/writing states, and three draft previews. The result is fully visible around six seconds. The same DOM and animation clock persist through onboarding. The main surfaces never disappear. This improves the mechanics, but it is still not the right visual composition.

## 4. Vaibhav’s latest feedback: the problems to solve now

- **The third agent has no convincing job.** Codex has built the product; Grok Bot can write the launch posts. Another coding agent, Claude Code, merely relaying context is confusing. Remove Claude Code from this story. A distinct personal/research/editorial assistant such as Muse, Instant/Instinct or Hermes could be considered only if it genuinely contributes something necessary. Do not swap logos simply to preserve a three-agent diagram. A direct Codex → Grok Bot story is a valid and probably stronger baseline.
- **Use the entire right-hand space.** We constrained the illustration to a roughly 500px-wide frame inside a much larger right pane, then nested three more rectangles inside it. It reads as a small box full of boxes. Vaibhav explicitly wants us to use the available canvas creatively, including on wider screens. Enlarging the same stack by a few pixels is not enough.
- **Cut the copy and metadata aggressively.** Codex, build note, connection codes, shared notes, requests, file labels, duplicate identities, reading/writing statuses and draft queues are all competing. The feature inventory is unnecessary for this job. Each agent’s role and the useful transformation should be apparent with very few words.
- **Show the outcome in its natural form.** The marketing output should look like an X post or X draft, using a recognizable post layout, rather than another generic text card saying that posts were generated. An author identity, concise post text and a believable draft treatment can communicate the result immediately. Use a sample handle if needed; do not invent a real account or show a post as actually published.
- **Improve the composition, not just the timing.** He wants a stronger visual/UX idea. The animation should fill the pane, tell one coherent story and feel like a polished product in use. “Use the space” and “there is too much going on” are the recurring points.

## 5. My critique of my own implementation

- I optimized local details—fade timings, card states, packet movement—without first solving the composition and the simplest causal story. Better micro-animation has not fixed a weak overall scene.
- I treated three participating agents as proof of collaboration. In this particular use case the third participant adds explanation cost without earning a role.
- I translated internal product concepts into visible labels instead of showing the transformation through recognizable artifacts. The UI is explaining its data model when it should be showing “what I built becomes a useful launch post.”
- The fixed-width nested frame wastes the right pane and makes the copy smaller. The source, bridge and outcome are visually similar, so the viewer must read to distinguish them.
- “Three drafts ready” plus small queue labels is weaker evidence than one convincing X draft, with other posts implied only if useful. A richer-looking outcome does not require more words or more status badges.
- The motion now has causality, but the generic card stack still dominates. I think we need a compositional reset: distinct source and outcome artifacts, minimal connective context, restrained depth/movement, and a clear visual payoff.

## 6. References to inspect

- https://roma.app/ — please inspect the complete public page and its connected task/agent motion, not only the top headline. Its continuity, task objects, paths and populated product scenes are the relevant qualities. Borrow the explanatory principle, not its claims of execution or its exact visual assets.
- https://www.simulithic.com/ — coherent product motion, concrete actions and outcomes, readable pacing.
- https://beui.dev/ — interaction finish and component motion, without turning the result into an effects catalogue.
- https://www.conductor.build/ and https://executor.sh/ — recognizable agent identities, product surfaces and considered visual language.
- https://spacesheep.dev/ — another current public product-surface reference we inspected. It is listed in YC Fall 2026: https://www.ycombinator.com/companies/spacesheep .
- https://wajo.ai/fo — Vaibhav supplied a signed-in Fo by Wajo screenshot as a **future workspace** reference: spacious central content, quiet sidebar, restrained dark surfaces and useful hierarchy. We are not asking you to access his account or redesign the workspace in this pass. Unrelated browser chrome/tabs from his screenshot are not in the packet.
- Todoist was the reference for simplifying the workspace information hierarchy. That is background context, not a request for a to-do-list animation.

The attached Roma task-connection reference came from the public product illustration. The other screenshots are clean captures of the current Commons prototype, not Vaibhav’s browser tabs.

## 7. What we want back from you

- Start with your candid diagnosis: the five most consequential design problems, grounded in the screenshots and clip. Say which user criticisms you agree with and where you would push back.
- Recommend the smallest credible story. Prefer a two-agent Codex → Grok Bot baseline. If you propose a third participant, give it a necessary, distinct job and explain why the extra complexity earns its place.
- Propose two compositions that use the full right pane. Include a rough visual/ASCII layout or an annotated sketch and select one direction. Think in source artifact → shared context → recognizable X draft, rather than another vertical stack of equal cards.
- Supply the exact minimal on-screen copy, including the X draft text, agent labels and any status that is genuinely necessary. The X output should be a draft for the product owner’s review.
- Give a timestamped storyboard for an automatic loop: what is visible immediately, what moves, what changes, how the result gets enough reading time, and how the reset avoids a dead/empty phase. No visible pause button, progress bar or “example workflow” label.
- Specify practical layout/motion values: use of the pane, relative sizes, readable type, spacing, depth, easing and durations. Keep the left onboarding form stable and preserve the right scene between steps. Include a static reduced-motion treatment.
- If possible, reply with a rough HTML/SVG prototype, annotated image or a small visual mockup—not only prose. The original source is in the packet so you can inspect its structure. Do not spend this pass rewriting the complete application.

Please assess a normal 1440×900 viewport, a wide 1920×1080 viewport, a smaller laptop, and the sensible mobile fallback. We would rather receive one opinionated direction we can implement than a long list of generic UI tips.

Reply to this email with your review and any proposal attachments. No need to contact anyone else, publish assets, create accounts or use paid services. We will use your feedback to make the next concrete iteration for Vaibhav to review.

Thanks,
Codex, working with Vaibhav
