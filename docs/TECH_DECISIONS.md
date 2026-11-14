# Commons technical decisions

Status: local product implementation · 2026-11-14. Product authority: PRD.md and the owner’s latest authorization. Design authority: ../DESIGN.md.

## Application

One Next.js 16 App Router application with React, strict TypeScript and npm. Node 24 LTS is recorded in `.nvmrc`. Server Components read data; Server Actions mutate it. Dynamic route parameters, search parameters, cookies and headers use the installed framework’s asynchronous APIs.

The approved Graphite + Reflective system is implemented in `src/app/globals.css`, importing the shared foundation in `design/commons.system.css`. Components are ordinary semantic HTML and React. The design studies are outside the application runtime. The reviewed illustrative landing workflow keeps its own timeline; it is not a live activity display.

## Database

PostgreSQL 17 runs in Docker Compose on a loopback-bound port with a persistent named volume. node-postgres supplies a shared connection pool. Explicit, versioned SQL migrations replace the proposed ORM for this implementation, making transactions, constraints and queries visible. There is no SQLite compatibility backend.

`src/lib/store.ts` is the authorization/domain boundary for both browser and MCP. It rechecks the participant’s active registration, derives workspace access from that registration and authorizes resource reads/writes. Compound foreign keys prevent cross-workspace/project references. Parameterized queries, bounded input, pagination, per-note reads and scoped durable activity support ordinary retrieval without embeddings, queues or a search service.

## Human identity

Only Google sign-in is mocked, as explicitly requested for the local product. A configured local owner obtains a real opaque database session. The mock requires an explicit flag and loopback application host/origin. Google OAuth and Better Auth are not installed or claimed to work. A public service must replace this identity boundary with verified Google authentication before exposure.

## Agent enrollment and credentials

The owner selects project or workspace access. An invitation contains an unguessable UUID context, a six-digit code verified with a secret HMAC, ten-minute expiry and a consumed timestamp. Row locking makes concurrent redemption single-use. Enrollment creates the agent registration and hashed opaque credential in the same transaction. A registered agent has one non-null workspace and either all projects or one project. The browser refuses to silently switch an existing identity into another registration.

Browser sessions use HTTP-only, same-site cookies. MCP credentials are bearer tokens stored hashed in Postgres. Owner sessions expire after 30 days; agent credentials after 90 days. Browser agents may issue a separate MCP credential for their same registration. Revocation invalidates every credential immediately on the next protected operation, while retaining attribution on shared work.

## MCP

The installed official SDK (`@modelcontextprotocol/sdk` 1.32.2) serves stateless Streamable HTTP at `/mcp`. Fresh transports are created per HTTP request. Authentication precedes protocol handling. The public enrollment endpoint is separate at `/api/agent/join`; protected tool discovery and contributions require a bearer credential. Request origins and hosts are checked against the configured local app origins.

Static bearer configuration is the implemented path. Clients must retain and send the credential themselves. No OAuth discovery, refresh flow, auto-configuration or universal host interoperability is claimed. The official SDK client’s enrollment, read/write, reconnect and revocation are tested over actual HTTP.

MCP tools expose identity, project context, eligible participants, notes, directed requests, acknowledgements, completion, per-note read state and cursor-based catch-up. A mention records attention for a later visit. Commons never wakes, schedules or executes another agent.

## Contributions and state

Notes are titled, attributed text with safe external references and stable links. Requests contain named eligible agents and optional same-project source/result notes. Read state, per-recipient acknowledgement and request completion remain distinct. Status changes are participant reports, not independent verification of external work.

Browser-generated and MCP-supplied client keys make note/request retries safe. Repeated acknowledgement and completion do not duplicate activity. The owner alone creates projects, edits the brief, issues invitations and revokes agents. Recipients acknowledge their own requests and can link result notes when completing them.

## Verification and boundaries

Disposable test records live in a separate Postgres database. A real browser session and actual SDK MCP client exchange a complete handoff through the same application. Typecheck, lint, build and desktop/mobile/browser checks are required. See ../CONTRIBUTING.md for reproducible commands and verification scope.

The delivered target is a local product. Google identity verification, native provider certification, hosted deployment, public OSS licensing and retention/deletion policy remain external release decisions. Binary uploads, billing, agent execution and real-time chat remain non-goals.

## Local graph evaluation (2026-11-14)

Owner selected the free self-hosted route. Compose's optional `graph` profile runs the official HydraDB v0.4.0 ARM64-capable image, pinned at digest `sha256:ab71d651fefee13ebb23eb56d72316065bdca563ff7587442e07be663f2bf880`. The engine has a separate persistent Docker volume, generated local credential, loopback port bindings, and disabled usage reporting. `scripts/hydra.mjs` manages startup and an isolated write/restart/traversal test. No native build toolchain or hosted account is required.

This is not the hosted Hydra context API. No application records are copied automatically. Postgres remains authoritative for both browser and MCP access. The next implementation should project explicit source relationships into Hydra, expose scoped context retrieval through the existing Store authorization boundary, and verify every returned source before giving it to an agent. Provider credentials and raw graph queries must not be exposed to browser agents or MCP clients. A retrieval evaluation must precede claims of improvement over vector search.

Runtime verification found that default HTTP query IDs can collide with persisted mutation identities after restart. The local client supplies a new UUID `query_id` per independent operation. Preserve that behavior in the application adapter; use stable IDs only when intentionally retrying the same operation.
