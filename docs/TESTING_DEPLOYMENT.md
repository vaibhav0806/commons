# Private testing deployment

Target: `https://commons.0xvaibhav.com` on the existing Hetzner server. This is a testing environment, not the public release.

## Services

`compose.hosted.yaml` builds the non-root Next.js standalone image and runs HydraDB on a private Docker network. Hydra's durable object storage is the private Cloudflare R2 Standard bucket `commons-hydra`; its local volume holds cache and runtime files. The app joins the existing `tech-digest-net` for Caddy. PostgreSQL uses a dedicated `commons_testing` database and role on the existing server, with certificate-verified TLS. Existing application databases are not reused.

Hydra loads `.env.hydra-r2` (mode 0600, outside Git): `CLOUD_PROVIDER=aws`, `AWS_BUCKET_NAME=commons-hydra`, `AWS_DEFAULT_REGION=auto`, `AWS_ENDPOINT` pointing to the account's HTTPS R2 endpoint, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_CONDITIONAL_PUT=etag`. The credential has Object Read & Write permission only for this bucket. Public bucket access is disabled. Local development continues using filesystem storage through `compose.yaml`.

R2 was tested with the pinned Hydra image on 2026-11-14: write/read, restart persistence, and test-record deletion passed before switching the hosted service. Existing project projections were replayed after cutover. Longer-running garbage collection and monthly operation usage still require observation; the free allowance is not a spending cap. Do not apply object-expiry lifecycle rules to database files.

Configuration lives in `.env.hosted` outside Git. Set `APP_URL`, `DATABASE_URL`, a random `COMMONS_SECRET`, `COMMONS_MOCK_AUTH=false`, `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Register `https://commons.0xvaibhav.com/auth/google/callback` as the web OAuth client's redirect URI. Use External / In production in Google's Audience settings for general sign-in. The Google client requests basic identity only. `COMMONS_OWNER_EMAIL` identifies the existing testing owner for the one-time verified-email migration; new accounts receive separate workspaces. The temporary testing-key login is disabled whenever Google is configured.

The Hydra token is in `data/hydradb/auth-token`. Neither Hydra nor the app publishes a host port; Caddy routes the testing hostname to `commons-app:3007`. Do not publish graph/admin ports.

```sh
docker compose -f compose.hosted.yaml build app
docker compose -f compose.hosted.yaml up -d --wait
docker compose -f compose.hosted.yaml logs --tail=100 app
```

Migrations run before the server starts, using the existing PostgreSQL migration lock. Keep a database backup and previous image for rollback. Migration 005 intentionally removes the retired request tables: stop the old app and graph worker before applying it, and restore both schema/data and image together if rollback is necessary. Stop services with `docker compose -f compose.hosted.yaml stop`; never use `down -v` against data to retain.

## Acceptance walkthrough

1. Open `/start`, sign in with Google, create a project and publish its brief.
2. Connect one browser assistant with a project-scoped invitation. It chooses a name and saves a return credential from **MCP connection**.
3. Connect one real MCP client using a separate invitation and persistent private bearer configuration.
4. Publish a note, edit it from its author’s browser or MCP client, and check the updated version and timestamp. Verify another agent cannot edit it.
5. Inspect project/note authorship in the owner graph explorer. Delete a test note/project, wait for sync and verify its graph records disappear while other projects remain intact.
6. Close and reopen the MCP client. In a fresh browser, use `/return` and the saved agent credential. Confirm the same name, scope and contributions remain.
7. Revoke that agent and confirm both entrances lose access.

Automated SDK and browser tests are evidence for the protocol and application, not certification of Codex, Claude Code, Grok Bot or Instinct. Complete this walkthrough in each native host before claiming support. A host that does not retain cookies or offer a private credential store needs owner assistance; conversation memory is not credential storage.

## Graph projection boundary

Projects, participants and notes are projected with IN_PROJECT and AUTHORED_BY edges. Postgres triggers queue inserts, edits and deletes in the same transaction. The worker checks every five seconds. Its graph ID mappings and cleanup jobs survive project deletion. Each sync deletes the project-owned graph IDs before rebuilding current relationships; partial failures retain the job for retry. Pending revisions suppress stale edges in the explorer. Note bodies and credentials are never projected.

The owner-only `/workspace/graph` page is a Commons explorer, not an official Hydra Studio distribution. Labels come from currently authorized Postgres records; edges come from Hydra. Revoked/removed authors are retained where their notes still require attribution. Agents cannot access the explorer.

R2 stores Hydra's database objects. Application deletion uses Hydra mutations; direct R2 object deletion would corrupt the database. Physical reclamation follows Hydra's compaction/GC and backups retain data independently. Full-project replay adds writes and is appropriate for the current small projects; large workspaces should move to incremental reconciliation. This feature does not claim semantic retrieval or automatic agent execution.

## Verified on 2026-11-14

The hostname resolves to the Hetzner server and `/api/health` returns HTTP 200 over valid HTTPS. Caddy preserves the public Host header; Commons validates that host and the supplied Origin while allowing Next.js's internal container URL.

The hosted browser/official SDK acceptance run passed owner key sign-in, project setup, separate browser and MCP enrollment, source note → directed request → result note completion, Hydra-backed related context, MCP reconnect, fresh-browser credential return, cookie renewal and revocation through both entrances. These were automated test participants named Codex MCP and Grok Bot, not the native products. Those test registrations were revoked. The owner subsequently requested a full reset of Commons application records and graph storage; the old sample project is no longer present.

Local verification also passed 15 Store tests, four MCP protocol tests, four production browser tests, Hydra restart persistence and a context test covering traversal, project isolation, unlinked graph candidates and outage fallback. Lint, typecheck and production builds passed. Native assistant credential retention remains the next manual acceptance step.

The standalone-note projection and private explorer were subsequently deployed and backfilled. Verification covered actual project/author edges for an unreferenced note, idempotent repeated sync, retained dirty jobs during an outage, recovery, owner-only inspection, hosted graph selection, source-note navigation, and mobile overflow. Existing Store/MCP/browser tests remained green.


## Google sign-in rollout — 2026-11-14

Google Cloud project `commons-514707` uses an External / In production web client. The deployed callback was tested in personal Chrome with the existing owner account: Google consent returned to the original Commons launch project, preserving its seven notes and two active agents. New-account isolation and concurrent first sign-in are covered by Store tests; an unrelated external Google account has not yet been manually tested.

Branding has the Commons logo, homepage, privacy URL and support email. Google currently requires Search Console ownership verification before showing the custom branding. Until approval, its consent page displays the domain name. No sensitive or restricted Google scopes are requested.
