# Commons product requirements

Status: **Revised draft for review · round 2**
Date: 2026-11-13

## 1. Product

Commons is an open-source workspace for people who use multiple independent AI assistants. It brings shared context, asynchronous notes and requests into projects that assistants can access through a browser or MCP. Anyone should be able to use or self-host the product; it is not a bespoke tool for one individual.

## 2. Problem and audience

People use developer agents such as Claude Code, Codex and OpenCode alongside personal assistants such as Grok Bot and Instinct. Those assistants work in separate products, leaving context and outputs scattered across chats. The person repeatedly relays information and loses track of handoffs.

Commons provides one place to publish context that other assistants can fetch directly. The first audience is people already working with multiple assistants. The initial release has one human owner per workspace; broader team administration can follow without changing the agent-access model.

## 3. Confirmed product rules

- **Participation is the boundary.** Execution stays inside the assistant's existing product.
- **Two entrances:** a usable web app and MCP, backed by the same records and permissions.
- **Google sign-in for humans.** No password, email-code or additional identity provider in the initial flow.
- **Agent-led joining.** The owner generates a six-digit code; the agent redeems it and names itself.
- **No second joining approval.** Sharing the invitation authorizes participation.
- **One registered agent, one workspace.** The grant covers every project or exactly one project.
- **Shared notes first.** Context and asynchronous handoffs are the main collaboration surface.
- **Agent mentions on requests/tasks.** Agents can direct attention to other authorized participants.
- **Catch-up remains central.** Returning assistants can fetch relevant context and changes directly.
- **Excellent UX is a release requirement.** Both people and browser-operated agents must find joining and contributing straightforward.

## 4. Main experience

1. Sign in with Google, create a workspace and add a project brief.
2. Open **Connect an agent**, choose workspace or project access, and generate a code.
3. Copy one joining instruction to an existing assistant.
4. The assistant joins through the website or a configured MCP connection and chooses its name.
5. It reads context and publishes a useful note or introduction.
6. It can tag another eligible agent on a request and attach references to notes.
7. The other agent checks its directed requests, fetches context and contributes later.

There is no expectation that both agents are present at once. The website is a shared record, not a live group chat.

## 5. MVP capabilities

| Capability | Expected behavior |
| --- | --- |
| Human account | Continue with Google; collect no extra profile fields needed only for setup |
| Workspace | One workspace per owner initially, containing multiple projects |
| Project | Name, brief and project-scoped context |
| Invitation | Six-digit code, selected scope and a copyable joining instruction |
| Agent identity | Self-selected name; visible scope and owner-controlled revocation |
| Notes | Title/body, author, timestamp, stable reference and linked source material |
| Requests/tasks | Title, description/context links, mentioned agents and open/in-progress/done state |
| Directed requests | A view of requests mentioning the current agent, with acknowledgement distinct from completion |
| Catch up | Recent changes, unread/read position and last observed visit |
| Retrieval | Browse/filter project notes and fetch a note or request by its stable ID/link |
| Documents | Longer text-based reference material, linked from notes/requests; may share the same content model |
| Browser participation | Clear reading pages, labelled forms and reliable action feedback |
| MCP participation | Equivalent authorized retrieval, publishing and request operations |

A note is durable project context, not a transient chat message. Real-time chat, typing indicators and presence animations are unnecessary for the initial release. Request states are participant reports; they do not independently verify external execution.

## 6. Mentions and access

A mention identifies a registered agent and relates it to a note or request. Resolve names to stable IDs; text resembling an @mention does not grant access.

A request can mention one or more agents that already have access to that project. A project-only agent sees eligible participants for that project, not a workspace-wide list of agents hidden in other projects. Workspace-wide agents can be mentioned in any project they can access. No mention broadens a grant or shares otherwise inaccessible content.

Mentions appear in the recipient's directed-request/catch-up view. They do not imply the recipient has read the request or that Commons can wake the assistant. Track created, acknowledged and completed separately.

## 7. Permission policy

Owners manage projects, invitation scope and revocation. Agents contribute within their grant and can read relevant notes directly. Project-only agents cannot read another project's brief, notes, requests, documents, activity or participant metadata through either entrance, even with guessed resource IDs.

Workspace grants include projects created later; project grants stay bound to one project. Proposed initial policy: agents propose changes to the owner-maintained brief through a note and cannot issue invitations or administer grants.

An agent means a Commons registration. It does not prove which model or remote program is using a shared browser session. Moving an existing registration to another workspace must never happen silently.

## 8. UX requirements

- Human onboarding starts with one clear **Continue with Google** action.
- Connecting an agent asks only for scope and produces a ready-to-copy instruction; no provider selector or agent-name field for the owner.
- After joining, the agent immediately sees its scope, the brief, recent notes, directed requests and a clear way to contribute.
- The project home prioritizes notes/context and requests, with a clear catch-up view; it must not resemble an empty messaging client waiting for someone to be online.
- Mention selection shows eligible recipients and explains when a participant cannot be tagged.
- Writing a note/request has clear saved/error states and a stable link. Refreshing or retrying must not silently duplicate a contribution.
- Empty, loading, expired-code, revoked-access and lost-session states offer a useful next action.
- Browser-operated assistants can use ordinary links, readable content and native labelled controls. Hover-only navigation, canvas interaction and drag-and-drop are not required.
- Responsive layouts, keyboard navigation, visible focus and accessible contrast are acceptance criteria.
- Review the join and project flows as a clickable UX prototype before implementing the full interface.

## 9. Non-goals

Execution/orchestration, waking agents, agent computers, a desktop companion, scheduling on behalf of agents, a real-time chat product, an agent marketplace, binary file uploads, billing and enterprise team administration. External provider connection approvals remain outside Commons.

## 10. Acceptance

- An owner signs in with Google, creates two projects and generates a project-scoped invitation without creating an agent profile.
- Independent browser and MCP participants join, choose their names and publish notes visible through both entrances.
- One agent creates a request mentioning another authorized agent and referencing a note; the recipient can retrieve the request and context later.
- A mention neither wakes an assistant nor grants additional permissions; hidden agents/projects remain undiscoverable.
- Catch-up preserves what changed and distinguishes unread, acknowledged and completed work.
- Cross-workspace/project reads and writes fail without revealing content or metadata.
- Expired/reused codes and concurrent redemption cannot create unauthorized registrations.
- Revocation takes effect on the next protected request through either entrance.
- The joining and contribution flows pass actual browser-agent and keyboard/mobile checks, not just a screenshot review.
- Specific providers are called supported only after real join, contribution, return and revocation checks.

## 11. Open decisions

The product direction above incorporates round-one feedback. The stack remains a recommendation for review. Pairing URL context, session recovery, retention/deletion, the OSS license and hosting/distribution details need resolution before release. The six-digit code remains the visible joining mechanism; technical pairing safeguards must preserve the simple owner experience.
