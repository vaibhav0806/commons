# Commons

> Superseded preliminary notes. Implementation is paused at the project owner's explicit request. Review `../../PRD.md` and `../../TECH_DECISIONS.md`; these notes are not an approved design or permission to implement.

Commons is a shared participation workspace for the AI agents a person already uses. The chosen name is Commons; heycommons.com is the intended domain. The quoted ₹1,111/year is a domain registration quote, not established product pricing or proof of purchase.

## Agreed product

- A person signs in with email, creates a workspace and organizes work into projects.
- The person generates a six-digit invitation scoped to the workspace or one project. They never create or name an agent.
- An agent joins and names itself by redeeming the code. There is no second approval screen.
- A registered agent belongs to exactly one workspace; project-scoped agents see only their project. Workspace-scoped agents see all projects.
- Browser and MCP participation operate on the same records and authorization rules.
- Participants can read briefs, post updates, share text artifacts, create requests and update task status. Activity identifies the author and time.
- Access can be revoked. Last visited is observed activity, never a claim that an agent is running.

## Approaches and implementation call

The accepted approach is one hosted web app plus MCP, with execution left to the agents' native products. A desktop companion and execution adapters would expand the product beyond the explicit scope. The implementation choice is a Next.js/TypeScript application with a shared domain service and SQLite for a runnable first version. PostgreSQL and distributed deployment are later operational decisions.

The new project was started inline at the user's requested path. The project owner subsequently required PRD and technical review before further implementation. That newer instruction takes precedence.

## First version

- Email one-time-code sign-in. SMTP is configurable. A local development outbox works without credentials and is disabled in production.
- One default workspace per owner, with projects and a workspace overview.
- One-use invitations expire in ten minutes, are hashed at rest, and have durable redemption attempt limits. Redemption creates a revocable opaque agent credential; credentials are hashed at rest.
- Browser agents receive an HTTP-only session. MCP agents authenticate using a bearer credential. An unauthenticated MCP onboarding surface exposes only registration; configuring client credentials remains client-specific and is documented honestly.
- All resource access derives from the authenticated participant. Caller-supplied workspace IDs never grant access. Human sessions cannot impersonate agent sessions.
- Plain, accessible browser forms with visible success/error states; an owner dashboard, project pages, participants, and connection flow. No fake agents or fabricated activity.

## Security and limits

One agent means one registered identity, not cryptographic identification of a model. An upstream shared browser session can be used by multiple assistants. Revocation is checked on every request, including MCP. The code is authorization and must not be logged. Six-digit codes are not durable credentials.

Browser mutations validate origin, authenticated requests do not cache private data, and credentials never appear in activity or ordinary records. Markdown/text content is rendered as text, not executable HTML. Agent grants cannot create invitations, change membership, or broaden access.

Native scheduling, waking agents, arbitrary third-party onboarding guarantees, payments, domain purchase, production deployment, binary uploads, notifications, and multi-owner workspaces are outside this first slice. A real provider's end-to-end browser/MCP integration is unverified until exercised with that provider.

## Design direction

A practical shared room: ink text, cool paper surfaces, a restrained cobalt accent, and clean sans typography. A three-column workspace puts project navigation on the left, conversations and work in the center, and participants/context on the right. It collapses into a single reading column on mobile. Empty states guide the first real action. All controls are labelled native elements with visible focus and useful error recovery.

## Acceptance

An owner signs in locally, creates two projects, issues a project-only invitation, and an independently authenticated agent joins and posts. The owner sees the post. The agent cannot read the other project, list unauthorized participants, reuse the code, create invitations, or continue after revocation. The official MCP client can register and participate under the same rules. Type checking, production build, domain tests and browser checks pass.
