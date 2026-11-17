# Commons project instructions

## Current gate

The owner approved the design system and authorized finishing the local product end to end. Only Google identity may be mocked. PostgreSQL runs locally in Docker; browser and MCP participation, permissions, persistence and handoffs must be real. The approved scope and execution sequence are in `docs/ROADMAP.md`.

Read `PRODUCT.md`, `DESIGN.md`, `docs/DESIGN_SYSTEM.md`, `docs/PRD.md` and `docs/TECH_DECISIONS.md`. The latest owner instructions supersede older review gates and preliminary plans. Preserve the approved visual system; remove study controls from the application runtime. Work inline and do not spawn subagents.

## Product boundaries

- Commons is a participation workspace for existing agents.
- Build it as a reusable product, not a bespoke application for the first user. Do not imply public open-source licensing until the owner selects one.
- Browser and MCP share records and authorization.
- Humans sign in with Google and issue a code; the agent joins and names itself.
- Shared asynchronous notes and project context are the collaboration model. Requests/tasks were removed by the owner; do not reintroduce them. Do not build a real-time chat product.
- Treat UX quality as a release requirement and review the core flows before building the full UI.
- No extra owner approval after code redemption.
- One registered agent belongs to one workspace, with workspace-wide or single-project access.
- Do not add execution adapters, a local companion or agent orchestration.
- Never claim a provider is supported without an actual integration check.

## Design authority

- Follow this order: latest owner instruction → `PRODUCT.md` → `DESIGN.md` → `design/commons.system.css` and active UI primitives → `docs/DESIGN_SYSTEM.md`. Historical studies and prototypes do not override that order.
- The owner approved the Mist & Lilac Paper redesign, Sora interface typography, Instrument Serif editorial titles, light default and explicit dark theme. Text fields use a subtle change to their existing border on focus, with no outer outline, ring, glow or added shadow. Apply the approved system throughout the actual product.
- Use the shared design roles and review a new component's relevant interaction, loading, error, empty, keyboard and reduced-motion states. Prefer existing `ActionMenu`, `DialogSurface`/`ConfirmationDialog`, `SelectField`, and `FeedbackProvider` over local variants. Record deliberate system changes rather than adding unrelated visual rules per screen.
- `docs/DESIGN_SYSTEM_V2.md`, `docs/DESIGN_RESEARCH.md`, `docs/LANDING_PAGE_PLAN.md`, `docs/PIXEL_REVIEW_BRIEF.md`, `docs/REVIEW_NOTES.md`, and static `design/` prototypes are archive material. Do not revive Graphite, requests, a visual Explorer, or legacy collections from those files.

## Work style

- Work inline. Do not spawn subagents unless the project owner explicitly requests delegation.
- Read existing code before editing; keep changes focused and readable.
- Do not add unrelated refactors or dependencies.
- Verify changes with appropriate tests and type/build checks when implementation resumes.
- Never add `Co-Authored-By` trailers or use `git commit --author`.
- Do not buy domains, send external messages, publish or deploy without authorization.
- Never commit credentials, local databases or outbox contents.

## Next.js

Read relevant guides in `node_modules/next/dist/docs/` before writing framework code. The installed version may differ from training-era Next.js conventions. Retain generated Next.js agent guidance if `next dev` adds it.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
