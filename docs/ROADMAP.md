# Commons implementation

## Implemented

- Mist & Lilac landing: Sora + Instrument Serif, light default/persisted dark, eleven-logo marquee, scroll-pinned project stories and reduced-motion fallbacks.
- Unified nested project tree; inline project naming and compact row/right-click menus, pages and folders with List/Board/Table views over versioned content items. Legacy collections remain compatible. Scoped page discussions are readable/writable through browser and MCP.
- Mobile navigation, inline project creation from every entry point, full-page Markdown-native document editing, full-screen discussion, scrollable boards/tables and accessible status editing.

- Real Google identity, isolated workspaces, browser sessions and scoped MCP participation.
- Single-use invitations, returning agent credentials, access revocation and project-scoped authorization.
- Shared project briefs, notes/references, per-agent read state, search and activity.
- Project create/rename/brief editing/delete; note create/edit/delete with version conflicts and edited timestamps.
- Agent details, rename/access editing, revocation/removal with retained authorship.
- Settings: profile/display name, workspace name/counts/deletion, account deletion, pending invitation cancellation, individual connection revocation and sign-out-other-sessions.
- Requests/tasks removed from UI, domain service, MCP and schema by migration 005. No archive/restore.
- Durable Hydra reconciliation removes obsolete graph nodes/relationships, retains deleted-project cleanup jobs and retries after outages. Hydra manages its own R2 objects.
- Reusable branding kit, favicons, app icons and social metadata.

## Verification

2026-11-14: lint/typecheck and production build passed; 17 domain tests, 5 MCP tests, 1 real Hydra reconciliation test and 5 production-browser scenarios passed. Browser coverage includes desktop/mobile CRUD, access controls, invitation/session management and workspace/account deletion. Deployed to commons.0xvaibhav.com after a private Postgres backup. The same Hydra reconciliation acceptance test passed against hosted Postgres and the R2-backed Hydra instance, using disposable data; public health returned OK.

Use `npm run check`, `npm run build`, `npm test`, `npm run test:mcp`, `npm run test:context` and `PLAYWRIGHT_PRODUCTION=true npm run test:e2e`. Automated tests use a dedicated test database. Browser/SDK evidence does not certify native provider compatibility.

Migration 005 is intentionally destructive only to the retired request subsystem. Back up the database, stop the old app/graph worker, migrate and deploy the matching code. Preserve graph cleanup jobs until successful sync. See TESTING_DEPLOYMENT.md for hosted operations.

## Remaining outside this iteration

Google custom-brand verification, long-running R2 usage/garbage-collection observation, native assistant return testing, licensing and public-release review. No claim of automatic agent execution, universal provider compatibility or semantic graph retrieval.
