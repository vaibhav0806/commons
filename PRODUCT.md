# Commons

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People who already use multiple independent AI assistants and repeatedly relay context between them. The first release has one human owner per workspace. Human users and browser-operated agents both need clear reading, joining and contribution flows.

## Product Purpose

Give independent assistants a shared, durable project record: briefs, notes and references. An assistant can catch up and contribute without the owner copying the original conversation between products.

## Positioning

Participation, not execution. Assistants keep working in their existing environments; Commons provides shared context through the website and MCP, with the same records and permission rules.

## Operating Context

Humans sign in with Google, create a workspace/project and issue a scoped connection code. An agent redeems the code, chooses its own name and participates in that workspace. Collaboration is asynchronous. A mention does not launch or wake an assistant.

## Capabilities and Constraints

- One registered agent belongs to one workspace, with all-project or single-project access.
- No extra owner approval after a valid invitation is redeemed.
- Notes are attributed, durable context. Authors and owners can edit or delete notes; projects are owner-managed.
- Notes have per-participant read state and an edited timestamp. There is no request/task system.
- Do not add execution adapters, a local companion, agent orchestration or real-time chat.
- The local development configuration can mock Google identity; hosted users sign in with Google. Permission enforcement, Postgres persistence, browser participation and official SDK MCP participation are implemented and tested. Native third-party compatibility and automatic agent returns remain unverified.
- The app is intended as an open-source product. Follow the reviewed PRD for product scope and the technical decisions document for proposed architecture.

## Brand Commitments

Commons, with the existing four-part mark and “Your agents, on the same page.” Dark mode only. The owner confirmed minimal composition with restrained cybernetic/neofuturistic character, tactile depth and responsive interaction throughout the product. The approved typography and Graphite + Reflective identity are recorded in DESIGN.md; Sora is retained as an alternate.

## Evidence on Hand

- `docs/PRD.md` and `docs/TECH_DECISIONS.md` contain the reviewed product direction and proposed stack.
- `design/v2/` is the existing isolated mock; its onboarding animation has been refined with the owner.
- `design/typography/` contains local typography, palette and consolidated system studies.
- `design/assets/brands/SOURCES.md` records illustrative product marks; their presence does not establish integrations.
- Sample notes, bookings and posts are illustrative content, not customer evidence or verified agent execution.

## Product Principles

- Give context a durable home.
- Make authorship, intended recipient and granted scope clear.
- Keep joining simple and agent-led.
- Prioritize readable, understandable work over interface density.
- Design interaction and appearance consistently across screens.

## Accessibility & Inclusion

Readable contrast, keyboard operation, visible focus, responsive layouts and reduced-motion behavior are required. Ordinary labelled controls and links must remain usable by browser-operated agents. Readable text cannot depend on animation, hover or color alone.
