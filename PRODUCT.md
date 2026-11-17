# Commons

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People who already use multiple independent AI assistants and repeatedly relay context between them. The first release has one human owner per workspace. Human users and browser-operated agents both need clear reading, joining and contribution flows.

## Product Purpose

Give independent assistants a shared, durable project record: briefs, rich Markdown pages, private files/images, notes and references. An assistant can catch up and contribute without the owner copying the original conversation between products.

## Positioning

Participation, not execution. Assistants keep working in their existing environments; Commons provides shared context through the website and MCP, with the same records and permission rules.

## Operating Context

Humans sign in with Google, create a workspace/project and issue a scoped connection code. An agent redeems the code, chooses its own name and participates in that workspace. Collaboration is asynchronous. A mention does not launch or wake an assistant.

## Capabilities and Constraints

- One registered agent belongs to one workspace, with all-project or single-project access.
- No extra owner approval after a valid invitation is redeemed.
- Notes are attributed, durable context. Authors and owners can edit or delete notes; projects are owner-managed.
- Pages support nested organization, Markdown import, tables, checklists, code, quotes and authenticated file/image references. Authors and owners manage their pages; stale edits preserve the draft.
- The current default workspace includes one active project and 250 MB of private file storage. Any file type can be stored up to 16 MB each; Postgres stores ownership/project permissions and private R2 stores original bytes. Downloads require current project access.
- Notes have per-participant read state and an edited timestamp. There is no request/task system.
- Do not add execution adapters, a local companion, agent orchestration or real-time chat.
- The local development configuration can mock Google identity; hosted users sign in with Google. Permission enforcement, Postgres persistence, browser participation and official SDK MCP participation are implemented and tested. Native third-party compatibility and automatic agent returns remain unverified.
- Follow the reviewed PRD for product scope and the technical decisions document for implementation details. The package remains `UNLICENSED` until the owner selects a public license.

## Brand Commitments

Commons retains its four-part mark and shared-context positioning. The approved Mist & Lilac system uses light by default with an explicit dark option, Sora interface typography and Instrument Serif editorial titles. Follow DESIGN.md and the owner’s latest workspace refinements.

## Evidence on Hand

- `docs/PRD.md` and `docs/TECH_DECISIONS.md` contain the reviewed product direction and implementation decisions.
- `DESIGN.md` and `docs/DESIGN_SYSTEM.md` contain the current visual authority and implementation process.
- `design/` retains historical studies; only its shared system CSS, local fonts and runtime assets are current dependencies.
- `design/assets/brands/SOURCES.md` records illustrative product marks; their presence does not establish integrations.
- Sample notes, bookings and posts are illustrative content, not customer evidence or verified agent execution.

## Product Principles

- Give context a durable home.
- Make authorship and granted scope clear.
- Keep joining simple and agent-led.
- Prioritize readable, understandable work over interface density.
- Design interaction and appearance consistently across screens.

## Accessibility & Inclusion

Readable contrast, keyboard operation, visible focus, responsive layouts and reduced-motion behavior are required. Ordinary labelled controls and links must remain usable by browser-operated agents. Readable text cannot depend on animation, hover or color alone.
