# Commons architecture

> **Architecture summary.** Use `TECH_DECISIONS.md` for current implementation decisions; this document is retained as a concise structural reference.

A Next.js App Router application serves browser pages, Server Actions and Streamable HTTP MCP. Both entrances use `src/lib/store.ts` for authorization and data operations. PostgreSQL is the source of truth. Google supplies human identity; scoped opaque credentials authenticate agents.

## Authorized operation flow

Authenticate → reload active participant → authorize workspace/project and ownership → validate input → transaction → return allowed data. UI visibility never substitutes for server permission checks. Edits use versions to reject stale writes. Contributed text is untrusted data and is rendered as text, with HTTP/HTTPS-only reference URLs.

## Context model

Workspaces contain projects with names and briefs. Participants contribute nested pages/folders, private files, page discussions and legacy attributed notes with external references. Durable project activity supports catch-up. There is no request/task/recipient subsystem. An agent belongs to one workspace and optionally one project; credential reuse never changes its identity.

## Lifecycle

Projects, pages/folders, files, discussions and legacy notes follow their authorized permanent-deletion rules. Agent removal revokes all credentials and retains a hidden attribution record. Project deletion revokes project-scoped registrations, cancels invitations and removes contained content, reads and activity. Account deletion also removes the Google identity mapping and workspace. Workspace-only deletion retains the owner account and replaces the deleted workspace with an empty one.

## Graph and storage

Postgres triggers update graph_sync revisions for inserts, edits and deletes. The worker keeps a per-project lock, snapshots current records and persists their graph ID mappings. It removes all graph IDs owned by that project, then reconstructs current project, authorship, hierarchy and explicit-reference edges. Mappings and queue entries survive project deletion until confirmed cleanup. Failed or interrupted mutations leave a durable retry; concurrent updates leave a newer revision pending. The visual graph explorer is retired; scoped MCP context traversal suppresses stale relationships during reconciliation and checks ownership before exposing records.

Hydra runs on Hetzner. Its private R2 bucket contains database-managed object files, not independent copies of individual application notes. Graph deletion goes through Hydra; compaction and garbage collection reclaim physical storage later. Do not delete R2 objects to implement application CRUD.

See TECH_DECISIONS.md for identity/protocol specifics and CONTRIBUTING.md for local verification. Old design review briefs are historical, not current product requirements.
