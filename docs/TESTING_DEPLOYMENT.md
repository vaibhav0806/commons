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

Projects, participants, notes, pages and files are projected with IN_PROJECT and AUTHORED_BY edges. Pages also project IN_PAGE parent relationships and explicit REFERENCES to pages/files in the same project. Postgres triggers queue inserts, edits and deletes in the same transaction. The worker checks every five seconds. Its graph ID mappings and cleanup jobs survive project deletion. Each sync deletes the project-owned graph IDs before rebuilding current relationships; partial failures retain the job for retry. Pending revisions suppress stale edges in the explorer. Note bodies and credentials are never projected.

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

## CRUD release verification — 2026-11-14

Migration 005 and the matching app/worker were deployed after a private Postgres backup and stopping the old processes. Local validation passed: lint/typecheck, production build, 17 domain tests, 5 MCP tests, 1 Hydra reconciliation test and 5 production-browser scenarios. Hosted acceptance also passed note edits/deletes, scope changes, outage/retry and project graph cleanup while retaining unrelated context. Temporary fixture data was deleted and the worker resumed. Public health returned OK. This verifies logical graph cleanup; immediate physical R2 object reclamation is not asserted.

## Content workspace deployment

`.env.files` (0600, outside Git) defines `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PREFIX=commons-files/`. The existing private bucket is reused under an isolated prefix, leaving Hydra objects untouched. The app and file-cleanup worker load this config. Keep it with private deployment configuration backups.

Retain the previous image and take a private Postgres backup before replacement. Migrations 006–008 are additive. App, graph-sync and file-cleanup use matching source, with workers starting after app health. A code rollback stops new workers and restores the previous app image, retaining additive tables/data. Do not drop content tables during rollback.

Backups now require Postgres plus application R2 objects; database dumps do not include file bytes. Do not apply bucket-wide expiry rules. Monitor durable `file_cleanup` jobs and pending upload reservations.

Validation commands include the existing check/build/domain/MCP/context/browser scripts plus `npm run test:workspace`. The workspace and browser tests use real R2 credentials with disposable objects and the dedicated `_test` database.

## Workspace release verification — 2026-11-14

Deployed application commit `1b79d2f` to the existing Hetzner testing environment. Migrations 006–008 applied without resetting the database. The previous `commons:testing` image was retained as `commons:pre-workspace-20261114` and a private custom-format database backup was saved before replacement.

Local verification passed: lint/typecheck, production build, 17 store tests, 5 MCP tests, 3 page/file/private-R2 tests, 6 production browser tests, and expanded graph reconciliation covering pages, parent relationships and file references. The existing local Hydra volume returned internal query errors even for basic queries; it was preserved, and graph verification passed with a separate disposable volume.

Hosted verification used a disposable workspace: saved and read a Markdown page; uploaded bytes through the public authenticated multipart route to private R2; downloaded identical bytes; rejected anonymous and revoked-agent downloads; rendered Home, Pages and Files with a real session; projected pages/files into hosted Hydra; then removed the fixture and confirmed existing project IDs were unchanged. `/api/health` returned `ok`. Native agent-provider certification remains a separate manual acceptance step.

Final worker check found and fixed the cleanup container's missing default network route (`4e35148`); its networks now match the app's outbound connectivity. The one-shot cleanup completed successfully after the fix, and final inspection confirmed zero queued file cleanup jobs and zero pending graph revisions.

## Mist & Lilac release — 2026-11-16

Application revision `df4ef20e868c4f952a8b38ba3a865becf81955c9` is deployed. Four implementation milestones were pushed on `feat/paper-workspace`: landing/theme foundation (`379d45a`), folders/collections/comments (`e3f12f7`), responsive workspace (`d974aaf`), and nested-row/control polish (`df4ef20`). The deployment uses a Git archive of the application revision; the hosted directory is not a Git checkout. App, graph-sync and file-cleanup run the same image, labeled with `org.opencontainers.image.revision`.

Before migration 009, a private custom-format Postgres dump was created at `backups/pre-mist-20261116.dump` and its archive listing was checked. `commons:pre-mist-20261116` retains the previous application image; `commons:mist-d974aaf` retains the first redesign deployment. Migration 009 adds kind/status columns and scoped page comments without resetting existing records. For a code rollback, retain the additive schema/data and replace all three application services with the chosen retained image. Do not restore an old dump over newer user contributions unless a data restore is explicitly intended.

Validation passed: lint/typecheck, production build, 17 Store tests, 5 MCP tests, 3 content/private-R2 tests, Hydra reconciliation and eight production-browser scenarios. A targeted production-browser rerun validates the final nested-sidebar action bounds. Browser scenarios cover desktop/mobile CRUD, nesting and contextual menus, collection views, shared discussions, theme persistence, scroll-driven stories and reduced motion. No GitHub CI checks are configured on this branch; these checks ran locally.

Live acceptance used an isolated workspace and real sessions. It verified light/dark desktop/mobile rendering; a collection status saved in the browser and read back through MCP; browser comments read by an MCP agent; private R2 bytes uploaded through MCP and downloaded through authenticated HTTP; anonymous download denial; revoked credential rejection; and hosted graph projection. The fixture was removed and the prior project IDs were preserved. Production Google configuration remains enabled and mock authentication remains false. Screenshots in the local release review package depict this disposable acceptance fixture.

## Sidebar interaction release — 2026-11-16

Application revision `5680e95c0a9f0a00087d47a9a85ab4004cc24ab2` supersedes the release above. App, graph-sync and file-cleanup share image `sha256:afe296e5bedfdb7bf8a75f3b8f44c3f28c3091e844e5f005dd8fe6d7024f10d5`. The prior image is retained as `commons:pre-sidebar-20261116`; no schema changes were needed.

The sidebar now creates projects inline, removes duplicate connection/search/access controls, uses one compact menu per tree row and restores the Home icon. Validation: lint/typecheck and production build; the eight existing browser scenarios; and a new desktop/mobile scenario covering cancelled drafts, client validation, failed-network draft preservation, successful creation without a brief, focus restoration, menu hit testing, right-click equivalence, compact menu geometry and both-theme hover colors. The focused rerun passed after fixing cancellation focus and menu layering above the mobile navigation dialog.

Live acceptance created a project inline and read it after a reload, verified absence of the removed sidebar/header controls, checked light hover and mobile dark menus, then exercised shared collection status/comments through browser and MCP, private R2 upload/download, anonymous/revoked access denial and graph projection. The isolated workspace was removed and existing project IDs were preserved. Review screenshots are local at `/Users/vaibhav/Downloads/commons-sidebar-2026-11-16`.

## Minimal workspace follow-up — 2026-11-16

Application revision `abf4914f1bfe5805558d2e5acd7c0f36f2227751` is deployed on all three application services using image `sha256:11634bf080128a1e42dbe989c6099fb6a5b20ba508d29870b81e6dc2624b64c0`. Rollback image: `commons:pre-minimal-20261116`. No schema migration or content conversion was required.

Project drafts now use Enter to save, Escape/outside pointer gestures to cancel, and error-only feedback. Unread routes redirect; neutral row states replace colored text/selection and nested action fills. Breadcrumbs no longer repeat the workspace name. Access dropdowns show project names without the extra suffix. Creation offers Page/Folder/Upload; editors and item links open in the main workspace. Folders expose List/Board/Table views while old collection records retain their contents and compatibility.

Validation passed: lint/typecheck, production build and all nine browser scenarios. Focused reruns covered final breadcrumb changes, full-page creation, folder views, discussions, outside cancellation, IME handling, hidden creation controls, zero-count suppression, neutral hover/action styles and concise access options. Hosted acceptance verified inline creation and full-page Markdown creation surviving reload, responsive light/dark rendering, old collection compatibility, shared browser/MCP status/comments, private R2 bytes and access denial. The disposable workspace was deleted and existing project IDs remained present. Screenshots: `/Users/vaibhav/Downloads/commons-minimal-2026-11-16`.

## Document editor release — 2026-11-16

Application revision `44897ba2dd079c7ae147c350b43b74cc984b5983` is deployed on app, graph-sync and file-cleanup using image `sha256:4b1463482510cdebe10b00f9e91f8fa8b89685bc958dca32d11da92cef882c96`. Rollback image: `commons:pre-document-abf4914`. No schema migration or bulk content conversion was required. PR #2 was already merged, so this follow-up is tracked in PR #3 on `feat/document-workspace`.

Every project-creation entry point uses the sidebar draft; the old route redirects to Home. Home's project hover fill is removed and tree actions have inset spacing. Milkdown/Crepe replaces the textarea and permanent insert toolbar with a document canvas, wrapping title, slash commands, selection formatting and private image uploads. Markdown remains canonical and Save remains explicit.

Validation passed: lint/typecheck, production build and all ten production-browser scenarios. A focused editor rerun also passed. Coverage includes exact no-op source preservation, editing existing HTML/image references without losing alt text, keyboard slash/selection formatting, real image uploads, desktop/mobile creation, browser/MCP sharing and access checks. No GitHub CI checks are configured; validation ran locally.

Hosted acceptance created and reloaded a document using the rich editor, read its saved body through MCP, reviewed light/dark desktop/mobile editors, checked collection status/comments across browser and MCP, and verified private R2 bytes and anonymous/revoked denial. Hosted graph projection passed. The isolated acceptance workspace was removed and the pre-existing project IDs were preserved. Review screenshots: `/Users/vaibhav/Downloads/commons-editor-2026-11-16`.

## Landing refresh and page autosave — 2026-11-16

Application revision `0c5642a20b771a148a36baddc39764b3cde6a45f` is deployed on app, graph-sync and file-cleanup using image `sha256:41cd3e0d6844450826d3967303b192d9df6d9e3b26667c36b2bc7b8de62141fd`. A private custom-format Postgres backup was verified before replacement; rollback image `commons:pre-refresh-44897ba` is retained. No schema migration or content conversion was required. Changes are pushed in separate commits on PR #3.

The landing now uses consistent header branding, left-only marquee blur, a secondary agent setup prompt, realistic illustrative projects with credited local photography, measured viewport-height story pinning and useful shared-context/access sections. Privacy links the operator’s name to X. Settings and invitation chrome are simplified, and document menus use the shared padded menu rows.

Pages autosave through the existing Store permissions/version model. Requests are serialized, new pages use idempotency keys, same-tab session drafts support recovery, and conflicts retain the draft without overwriting the server. Lost acknowledgements are recognized on reload. The sidebar updates after saves. Folder forms remain explicitly submitted.

Lint/typecheck and production build passed. The full browser run passed ten scenarios and exposed a story-height feedback loop in the landing scenario; measured tab height fixed it, and landing/autosave focused reruns passed. All eleven scenarios are covered, including slow/failing requests, reload and lost-ack recovery, optimistic conflicts, origin/session/author denial, Markdown preservation, private images, shared browser/MCP records, keyboard, reduced motion and responsive themes. No GitHub CI checks are configured.

Hosted acceptance verified a newly autosaved document surviving reload and readable through MCP, board status and comments shared across browser/MCP, private R2 bytes and anonymous/revoked denial, settings/privacy changes and desktop/mobile themes. All three project photographs were decoded from the hosted assets. Graph projection passed. The isolated acceptance workspace was removed and existing project IDs were preserved. Screenshots: `/Users/vaibhav/Downloads/commons-refresh-2026-11-16`.
