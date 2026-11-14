# Working on Commons

Use Node 24 LTS, npm and Docker Desktop. The application uses Next.js App Router, React, TypeScript, node-postgres, explicit SQL migrations and the official MCP TypeScript SDK. Read PRODUCT.md and DESIGN.md before changing behavior or UI.

## Run locally

```sh
nvm use
npm ci
npm run setup
npm run dev
```

Open http://localhost:3007. `setup` creates a private `.env.local` with a random signing secret if it does not exist, starts the project’s Docker Postgres, applies migrations and prepares the separate test database. It preserves existing database contents. Docker Desktop must be running.

Postgres listens only on `127.0.0.1:15437`. Application data lives in the named Compose volume. `npm run db:down` stops the database without deleting it. Do not remove the volume to restart the application.

The local owner is configured by `COMMONS_OWNER_EMAIL` and `COMMONS_OWNER_NAME`. Continue with Google creates a real local owner session, but **does not contact Google or verify a Google account**. The mock requires `COMMONS_MOCK_AUTH=true` and a loopback APP_URL/Host. Sessions, scopes, invitations and contributions are real database records. Do not expose this local identity mode as a hosted sign-in service.

## Optional graph engine

Use `npm run hydra:up` to start the free self-hosted HydraDB service. `npm run hydra:status` and `npm run hydra:logs` inspect it; `npm run hydra:down` stops only that service. `npm run test:hydra` restarts HydraDB while verifying persistence, so avoid running it during graph work. Postgres is unaffected. The graph engine receives project membership and note authorship relationships through a durable Postgres queue. Run `npm run graph:watch` to process it locally. See the [README](README.md).

## Check changes

```sh
npm test
npm run test:mcp
npm run test:e2e
npm run typecheck
npm run lint
npm run build
PLAYWRIGHT_PRODUCTION=true npm run test:e2e
```

Store and MCP tests use `TEST_DATABASE_URL`. Browser tests start an isolated app on port 3008 with that database and their own local owner. They do not use the application’s normal port or database. The database name must end in `_test`. Tests create uniquely identified records; they do not truncate the product database.

The browser test uses installed Google Chrome in headless mode. If Chrome is not installed, install it or change Playwright’s channel deliberately. Test traces are retained on failure; `test-results/` is ignored.

Run the optimized local build with `npm run build` followed by `npm start`. Both development and production serve the same approved interface. The old static studies remain reference material under `design/` and are not routes or runtime dependencies of the application, except the shared approved CSS foundation and referenced fonts.

## Data and operations

`npm run db:migrate` applies outstanding versioned SQL migrations. Add a new migration when the schema changes; do not edit an already applied migration. The migrator serializes concurrent runs with a PostgreSQL advisory lock and commits each migration atomically.

For a local backup:

```sh
docker compose exec -T db pg_dump -U commons commons > commons-backup.sql
```

Keep backups private and outside Git. Restoring/importing data is an explicit operator operation. `.env.local`, credentials, database files, backups, browser traces and generated reports must not be committed.

Notes render contributed content as text. Reference URLs allow HTTP/HTTPS only. Browser actions and MCP use the same Store methods; do not add a second permission implementation to an HTTP handler or UI component. Keep registered agents bound to their workspace and optional single project.

## Local verification

The implementation includes database tests for atomic invitation redemption, project/workspace boundaries, eligible mentions, retry-safe writes, separate read/acknowledge/complete states and credential revocation. MCP tests connect the official SDK over HTTP, enroll, publish/read, reconnect and verify revoked credentials fail.

The browser suite exercises project/note creation, editing and deletion, an independent agent and official MCP client sharing notes, settings, scope changes, return credentials, responsive controls and revocation. Store tests cover stale writes, author/owner permissions, account deletion and session management. `npm run test:context` verifies Hydra cleanup and retry after an outage.

These tests establish the local application and protocol path. They do not establish native Codex, Claude Code, Grok Bot, Instinct or other third-party provider compatibility, automatic agent returns, external posting/calendar actions or a security certification. Hosted Google sign-in has separate live verification recorded in [testing deployment](docs/TESTING_DEPLOYMENT.md).

## Contribution scope

Work inline unless the owner explicitly asks for delegation. Keep the approved dark-only visual system and accessible interaction states. No execution runtime, real-time chat, billing or orchestration is part of this implementation. The OSS license remains a separate owner decision before public distribution.


## Historical local delivery verification · 2026-11-14

This records the initial implementation pass, not the result of the latest checkout. Run the commands above to verify current changes.

Executed: 10 PostgreSQL domain tests, 4 HTTP MCP SDK tests, the complete Playwright handoff in development and optimized production, typecheck, lint, production build and dependency audit. The audit reported zero vulnerabilities after pinning the ESLint parser’s patched minimatch dependency. Desktop/mobile widths checked: 1440, 768, 390 and 320px. Mobile project switching and unread views were exercised, not just resized.

Inspected rendered landing, setup, project and detail screens. Production probes checked real local sign-in, persistent onboarding scene identity, border-only field focus, reduced motion, responsive forms and database health. Saved handoff notes remained after restarting the Postgres container. The working database was cleared only of the three early smoke-test projects created during implementation; final automated tests run separately. No real Google account, calendar, X account or external model provider was contacted.
