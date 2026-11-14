# Commons technical decisions

Status: local and hosted product implementation · 2026-11-14. Product authority: PRD.md and the owner’s latest authorization. Design authority: ../DESIGN.md.

## Application

One Next.js 16 App Router application with React, strict TypeScript and npm. Node 24 LTS is recorded in `.nvmrc`. Server Components read data; Server Actions mutate it. Dynamic route parameters, search parameters, cookies and headers use the installed framework’s asynchronous APIs.

The approved Graphite + Reflective system is implemented in `src/app/globals.css`, importing the shared foundation in `design/commons.system.css`. Components are ordinary semantic HTML and React. The design studies are outside the application runtime. The reviewed illustrative landing workflow keeps its own timeline; it is not a live activity display.

## Database

PostgreSQL 17 runs in Docker Compose on a loopback-bound port with a persistent named volume. node-postgres supplies a shared connection pool. Explicit, versioned SQL migrations replace the proposed ORM for this implementation, making transactions, constraints and queries visible. There is no SQLite compatibility backend.

`src/lib/store.ts` is the authorization/domain boundary for both browser and MCP. It rechecks the participant’s active registration, derives workspace access from that registration and authorizes resource reads/writes. Compound foreign keys prevent cross-workspace/project references. Parameterized queries, bounded input, pagination, per-note reads and scoped durable activity support ordinary retrieval without embeddings, queues or a search service.

## Human identity

Hosted humans sign in with Google OpenID Connect using the official Google authentication library. Authorization uses a ten-minute one-use server-side state record, PKCE and nonce verification. ID tokens are checked for signature, issuer, audience, expiry and verified email. Only openid, email and profile are requested; Google access/refresh tokens are not retained. The stable Google subject maps to a participant. First sign-in may link the configured legacy testing owner's verified email; other email collisions are rejected. New identities receive isolated workspaces, and returning identities keep their workspace.

Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on the server and register APP_URL + /auth/google/callback exactly. Once configured, the temporary owner-key action is disabled. The local mock remains explicitly restricted to loopback hosts and COMMONS_MOCK_AUTH=true. Production sets COMMONS_MOCK_AUTH=false.

## Agent enrollment and credentials

The owner selects project or workspace access. An invitation contains an unguessable UUID context, a six-digit code verified with a secret HMAC, ten-minute expiry and a consumed timestamp. Row locking makes concurrent redemption single-use. Enrollment creates the agent registration and hashed opaque credential in the same transaction. A registered agent has one non-null workspace and either all projects or one project. The browser refuses to silently switch an existing identity into another registration.

Browser sessions use HTTP-only, same-site cookies. MCP credentials are bearer tokens stored hashed in Postgres. Owner sessions expire after 30 days; agent credentials after 90 days of inactivity. Successful agent authentication renews their expiry, and browser workspace visits renew the cookie. `/return` accepts a valid agent credential and creates a new browser session under the same registration. Browser agents may issue a separate MCP credential for their same registration. Revocation invalidates every credential immediately on the next protected operation, while retaining attribution on shared work.

## MCP

The installed official SDK (`@modelcontextprotocol/sdk` 1.32.2) serves stateless Streamable HTTP at `/mcp`. Fresh transports are created per HTTP request. Authentication precedes protocol handling. The public enrollment endpoint is separate at `/api/agent/join`; protected tool discovery and contributions require a bearer credential. Request origins and hosts are checked against the configured application hostname and allowed origins.

Static bearer configuration is the implemented path. Clients must retain and send the credential themselves. No OAuth discovery, refresh flow, auto-configuration or universal host interoperability is claimed. The official SDK client’s enrollment, read/write, reconnect and revocation are tested over actual HTTP.

MCP tools expose identity, project context, eligible participants, notes (including edits/deletes), per-note read state and cursor-based catch-up. Contributions are shared context for a later visit. Commons never wakes, schedules or executes another agent.

## Contributions and state

Notes are titled, attributed text with safe external references and stable links. The owner can manage all notes; agents can edit/delete only their own. Project names and briefs are owner-managed. Version checks reject stale project/note edits and note deletes rather than silently overwriting changes. Edited notes become unread again. Requests, recipients, acknowledgement and completion were removed in migration 005.

Owners manage agent names/scopes, revoke access or remove registrations. Removal retains the attribution row but hides it from agent lists. Project deletion invalidates scoped agent sessions and invitations and removes its notes/activity. Settings manages display names, workspace names, pending invitations and per-connection revocation. Deleting a workspace creates an empty replacement while retaining the owner account; deleting an account also removes its Google identity and sessions. Backups have a separate operational retention lifecycle.

## Verification and boundaries

Disposable test records live in a separate Postgres database. A real browser session and actual SDK MCP client exchange a complete handoff through the same application. Typecheck, lint, build and desktop/mobile/browser checks are required. See ../CONTRIBUTING.md for reproducible commands and verification scope.

The product runs locally and in a private Hetzner testing deployment. Google branding verification, broader native-provider return testing, public OSS licensing and product-level editing/deletion remain outstanding. Billing, agent execution and real-time chat remain non-goals.

## Local graph evaluation (2026-11-14)

Owner selected the free self-hosted route. Compose's optional `graph` profile runs the official HydraDB v0.4.0 ARM64-capable image, pinned at digest `sha256:ab71d651fefee13ebb23eb56d72316065bdca563ff7587442e07be663f2bf880`. The engine has a separate persistent Docker volume, generated local credential, loopback port bindings, and disabled usage reporting. `scripts/hydra.mjs` manages startup and an isolated write/restart/traversal test. No native build toolchain or hosted account is required.

This uses the self-hosted Hydra graph engine. Postgres remains authoritative for both browser and MCP access. Explicit source/result relationships are projected into Hydra through the Store authorization boundary and every returned source is revalidated before being returned to an agent. Provider credentials and raw graph queries must not be exposed to browser agents or MCP clients. A retrieval evaluation must precede claims of improvement over vector search.

Runtime verification found that default HTTP query IDs can collide with persisted mutation identities after restart. The local client supplies a new UUID `query_id` per independent operation. Preserve that behavior in the application adapter; use stable IDs only when intentionally retrying the same operation.

## Private hosted testing and graph retrieval (2026-11-14)

The owner authorized a Hetzner testing deployment at commons.0xvaibhav.com. External Google sign-in is live and replaces the temporary testing-owner key entrance. The loopback-only mock remains disabled on the server. Hydra runs on Hetzner with private Cloudflare R2 Standard object storage; Postgres remains on Hetzner. See TESTING_DEPLOYMENT.md for configuration and verification.

HydraDB projects project membership and note authorship. Postgres remains authoritative for content and authorization. The durable graph_sync queue and graph_entities mappings survive project deletion until cleanup succeeds. The worker locks per project, captures a versioned snapshot, deletes the graph IDs owned by that project with batched DETACH DELETE, then rebuilds its current edges. Retry after a partial failure is safe. A concurrent change increments the revision and schedules another pass. Stale edges are withheld from the explorer while a revision is pending. Old request relationships are removed on the next sync after migration 005. R2 stores Hydra-managed database objects; application deletion must use graph mutations, never direct bucket-object deletion. Physical storage reclamation follows Hydra compaction/garbage collection, not immediate per-note object removal.

## Paper content workspace — 2026-11-14

Migrations 006–008 add project-scoped Markdown pages, file metadata, R2 cleanup and content graph projection. Page hierarchy changes lock the project row and reject recursive cycles. Author/owner checks and optimistic versions match note behavior. `react-markdown` and `remark-gfm` render Markdown without raw HTML and retain the library URL sanitizer.

The S3 SDK uses private R2 with generated object keys under `R2_PREFIX` (default `commons-files/`) and workspace UUIDs. User filenames never become object paths. The current host reuses its private bucket under this isolated prefix; no public access or bucket-wide lifecycle settings change. Downloads are proxied through Commons, reauthorize after storage I/O and use no-store/nosniff and attachment disposition. PNG/JPEG/GIF/WebP byte signatures enable safe inline image previews. Credentials never reach tool results or page props.

Uploads reserve hidden metadata before writing bytes and publish only after completion. Failures enqueue deletion even after registration/project revocation. Postgres deletion triggers persist cleanup independently of deleted projects. `scripts/file-cleanup.mjs` locks cleanup rows and retries; abandoned hidden uploads expire after an hour. Logical deletion is immediate; physical R2 deletion is eventual.

Hydra projects pages/files, authors, page parents and explicit in-project file/page references. It stores neither page bodies nor file bytes. Cross-project links do not create edges. Postgres remains authoritative, and pending graph revisions suppress stale relationships.
