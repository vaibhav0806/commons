> Implementation update: Direction A is now available at `/` for review. The centered hero and shared project replace the rejected sculpture. Context, requests, and results can be inspected directly or followed by desktop scroll. Mobile and reduced-motion users use direct controls. The Toolcraft starter has been scaffolded separately; no generated asset is shipped yet. Earlier proposal details below describe intent, not a claim that every optional experiment was implemented.

# Commons landing page — proposed redesign

Status: design plan for owner review. No application changes made in this pass.

## What failed

The split hero and abstract ribbon sculpture competed with the product story. The motion could have belonged to any AI product. Later sections repeated the same launch example rather than building understanding. Adding animation did not solve the composition or establish a distinctive identity.

## Fixed decisions

- No left/right hero.
- Preserve dark Graphite + Reflective, Space Grotesk, Geist, readable controls and the Commons mark.
- Neo-futuristic/Y2K character comes through authored material, typography, transitions and product surfaces.
- Commons provides participation and durable shared context. Mentions do not execute or wake agents.
- Keep the current application and onboarding intact while exploring the public landing.
- Do not present illustrative assistant activity as a live integration or customer evidence.

## Reference reading

Visually inspected first viewports and a second scroll position, 14 November 2026:

| Reference | Useful discipline | Commons interpretation |
| --- | --- | --- |
| https://opencode.ai | Distinct typography and substantial product artifacts | Let actual product content carry identity and proof; keep our approved type families |
| https://vorflux.com | Broad product presentation with expressive surrounding material | Give the workspace a large stage; do not copy its autonomous-agent claims |
| https://hydradb.com | A subject-specific visualization | Visualize context remaining in a project, rather than an arbitrary particle shape |
| https://tracwell.app | Centered proposition followed by a substantial dashboard preview | Make the product visible immediately beneath a short introduction |
| https://beui.dev | Cohesive interactive components and direct demonstration | Give controls and previews purposeful, consistent responses |

These captures establish composition, not a complete audit of their animation implementations.

## Three possible compositions

### A. A shared project unfolds — recommended

A centered headline and CTA sit over a wide workspace stage. One project develops through the page: context is contributed, a request references it, another assistant returns a result. Scroll changes the focus within that same project. The scene is the recognizable visual asset.

Strength: understandable and specific to Commons. Risk: it requires very good typography, material and pacing to avoid looking like an ordinary dashboard screenshot.

### B. The product is the opening screen

A compact headline spans the top; a large interactive Commons project occupies most of the first viewport. The visitor can inspect a note, a request and a result immediately. Explanation follows below.

Strength: concrete, unusually direct and more exploratory. Risk: a new visitor might mistake the demo for the actual app; sample boundaries and the primary CTA must remain obvious.

### C. An editorial launch story

Large full-width statements alternate with close crops of real artifacts: a product note, the relevant request, a calendar result and a saved launch draft. Each composition has a different scale and density, tied together by authorship and persistent project identity.

Strength: strongest graphic freedom and changing rhythm. Risk: can become a film about the example instead of explaining the reusable product.

## Recommended page sequence (A)

### 1. A clear opening

Small navigation: Commons, How it works, Sign in.

Centered headline: “Your agents. On the same page.”

Supporting line: “One workspace for the context, requests and results your AI assistants share.”

Primary: Create your workspace. Secondary: Explore the handoff.

At a 1440 × 900 viewport, the upper portion of the workspace is already visible. Avoid a full screen of headline, empty space and decoration.

### 2. The shared project becomes the demonstration

A full-width project surface, approximately 1100px maximum width, directly below the introduction. It is an edited representation of the actual product, not a second invented app.

Opening: Codex contributes the product notes and alpha signups. A quiet attribution identifies the author. The project remains the enclosing surface.

Next: two directed requests reference those notes. Their intended recipients are clear. There are no agent-to-agent transport arrows suggesting an execution pipeline.

Result: Instinct's schedule and Grok Bot's draft appear as saved contributions inside that same project. The original source notes remain identifiable.

The intro may autoplay once; subsequent chapters follow scroll. No long loop or typing delay blocks a scroll. Direct chapter controls work by click, touch and keyboard.

### 3. Show why shared context matters

Keep the project surface and change the inspected item rather than introducing another full workflow diagram. Three short chapter statements:

- “Leave the context once.” Inspect the attributed source note.
- “Give the next agent a starting point.” Inspect a request with its source reference.
- “Keep what comes back.” Inspect the saved result linked to the request.

A visitor can select the corresponding artifact. Selecting it produces an intentional expansion and visible selection state. No fake terminal logs, irrelevant counters or perpetual presence indicators.

### 4. Make joining feel simple

A shorter, quieter composition demonstrates: choose scope → copy invitation → agent joins.

Keep the consumer promise simple: one invitation. Explain browser and MCP as participation paths below, rather than making users choose a technical transport first.

Use a visibly illustrative invitation. Never expose a real code or credential in marketing content. Do not imply every assistant can configure MCP automatically.

### 5. Resolve objections and close

Three concise questions: Does Commons run my agents? What can an agent access? How does an agent join?

Close with “Give your agents some common ground.” and one workspace CTA. A large, restrained Commons wordmark can finish the visual rhythm. No fabricated testimonials, customer counts or integration badges.

## Visual signature

The signature is a shared context surface that accumulates real attributed work. Material supports that idea: thin silver edges, layered graphite planes, brief specular responses, recognizable agent marks and occasional point texture at the stage boundary. Reading content remains matte and stable.

Use deliberate changes in scale: confident opening type, wide product view, closer artifact inspection, compact joining sequence, quiet close. Do not default to identical cards or repeat the same split composition down the page.

The Y2K/neo-futuristic expression should remain visible in a still screenshot. If removing motion makes the design generic, the composition needs more work.

## Motion storyboard

| Trigger | Visible event | Purpose |
| --- | --- | --- |
| First arrival | Workspace boundary resolves, then the first authored note appears | Establish the shared place and authorship |
| Scroll to requests | The source note stays in place while its referenced requests appear | Explain context reuse |
| Scroll to results | A saved contribution joins the same project; its source relationship remains visible | Explain durable handoff |
| Select an artifact | Selected item expands into readable detail; surrounding context remains | Make the demonstration inspectable |
| Hover a control | Local edge/foreground response; at most a small positional change | Indicate action and material |
| Hover a reference | Underline or boundary strengthens; linked artifact subtly responds | Explain the relationship |
| Exit a chapter | Previous focus settles while the next gets emphasis | Preserve continuity |

Routine responses use existing 140/260ms roles. Authored transitions may take 450–700ms. Reading time belongs to the visitor. No scroll hijacking, cursor replacement, mandatory waits, random orbiting objects or repeated fade-up on every element.

On mobile, the scene becomes stacked, directly selectable artifacts. Avoid shrinking a desktop screenshot or requiring long pinned scroll sections. Reduced motion exposes the same complete information with direct state changes.

## Implementation decision

Use Impeccable's new-work guidance for composition, animate for the motion storyboard, critique for an honest visual review, and polish only after the concept is sound. It is a local skill, not an independent designer we contacted.

Choose the animation implementation after the composition is selected. A coordinated timeline may justify GSAP/Motion; Toolcraft may help author a purposeful material asset. Installing either is not evidence that the design improved.

## Next review artifact

Produce desktop and mobile static compositions plus three storyboard states for the chosen direction before replacing runtime code. Review identity, immediate comprehension and composition first. Then build the motion and review normal-speed playback.

Acceptance: within five seconds, a new visitor can identify Commons as the shared workspace, distinguish source context from a request and a result, and find the joining action. The page should remain distinctive when paused and understandable with reduced motion.
