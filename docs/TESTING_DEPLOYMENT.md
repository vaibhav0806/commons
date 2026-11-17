# Deployment and verification history

Live target: `https://commons.0xvaibhav.com` on the existing Hetzner server. Entries below distinguish local validation from hosted deployment; older testing labels describe the original rollout.

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

## Inline media and focused Explorer — 2026-11-16

Application revision `4ca6433d5eb82aca4344d7622447b09cb5d66b06` is deployed on app, graph-sync and file-cleanup using image `sha256:4a859dac6e00eb59f1f92ee6aa3b6a539e371af6a37ec69e8b0682b38f04274e` (OCI revision label `4ca6433`). The private Postgres backup `backups/pre-explorer-20261116.dump` was verified before replacement; rollback image `commons:pre-explorer-0c5642a` is retained. No schema migration. Implementation is pushed in three milestones on PR #4.

All 13 production-mode browser tests pass, as do lint/typecheck, production build, five MCP tests and real Hydra reconciliation/source-path checks. Clipboard images with accompanying HTML now upload privately instead of keeping the external URL. Browser coverage includes paste/reload, file drag/drop, slash-menu image upload, in-context attachments/project upload, persistent sidebar collapse, concise navigation, neutral contents hover, SVG disclosure arrows and light/dark/mobile Explorer. No GitHub CI checks are configured.

Hosted acceptance verified a real photograph pasted into the editor, retained after reload and read through MCP; anonymous private-image denial; inline attachment without navigation; contextual project upload dialog; desktop sidebar preference; neutral contents hover; two-hop source paths through the hosted Hydra engine; and responsive light/dark Explorer. Agent revocation was checked through actual MCP HTTP. The isolated workspace was removed and pre-existing project IDs were preserved. Screenshots: `/Users/vaibhav/Downloads/commons-explorer-2026-11-16`.

Track 2 is the intended submission direction. The curated two-source retrieval fixture demonstrates explicit provenance; a vector-baseline comparison and measured token savings remain outstanding. Muse consultation could not run because its configured T3 provider was disabled.

## Workspace spacing and reduced chrome — 2026-11-16

Application revision `e1e7ad794762cda0896591e50b2c14bdc6513dab` is deployed on app, graph-sync and file-cleanup with image `sha256:d802f8247d879f463ba7586e43da4085849962d465d2878d25136c531d1751f3`. The database backup `backups/pre-polish-20261116.dump` was verified; rollback image `commons:pre-polish-4ca6433` is retained. No schema changes.

Home has one main creation action. Settings/Explorer spacing is consistent, project contents occupy the full width, and Activity is a collapsed disclosure with compact rows. Landing section navigation and the setup-prompt helper sentence are removed.

Validation passed: lint/typecheck, production build, three existing production-browser scenarios covering navigation/settings/landing, and isolated local plus hosted acceptance for empty states, 32px Settings spacing at desktop/mobile widths, keyboard Activity disclosure, full-width contents, landing removals and mobile overflow. Hosted health is OK. The disposable acceptance workspace was removed. Screenshots: `/Users/vaibhav/Downloads/commons-polish-2026-11-16`.

## Activity panel and safe Markdown breaks — 2026-11-16

Application revision `ebb8615` is deployed on app and both workers with image `sha256:48b92068c08f95d21734ba955a292f89813d0877ebb0042fae88a775e2969e95`. Backup `backups/pre-refine-20261116.dump` was verified; rollback image `commons:pre-refine-e1e7ad7` is retained. No migration.

Plain line-break HTML tags render safely in the reader and editor, without enabling arbitrary HTML or changing code examples. Project Activity is an on-demand panel in the action menu, including mobile. The duplicate signed-in header Workspace link and destructive-action ellipses are removed.

Lint/typecheck, production build and four targeted production-browser scenarios passed. Final regression checks include mobile Activity access/close, literal code, inactive attribute-bearing HTML, original-source preservation and private image editing. Isolated local and hosted walkthroughs verified the same reader/editor line breaks, light/dark mobile Activity, single hero CTA and retained anonymous sign-in. Public health is OK; test workspaces were deleted. Screenshots: `/Users/vaibhav/Downloads/commons-refine-2026-11-16`. Muse consultation was unavailable because its configured provider is disabled.

## Compact discussion and page actions — 2026-11-16

Application revision `7706cdf` is deployed on app, graph-sync and file-cleanup with image `sha256:db3596113b5994031a0aaa90dfb8f28914b9a6a6b74ac414c1c4347d635a161f`. Backup `backups/pre-discussion-20261116.dump` was verified before replacement; rollback image `commons:pre-discussion-ebb8615` is retained. No migration.

The shared reader/editor toolbar no longer includes Copy page link. Discussion has one heading, smaller page context, no repeated instructional copy, and a compact comment composer with a right-aligned submit button. Home project icons use a flat background in light mode; the dark appearance is preserved.

Lint/typecheck, production build and the existing desktop/mobile discussion browser scenario passed. Isolated local and hosted walkthroughs verified reader/editor control removal, comment submission and persistence after reload, desktop light/dark appearance, 390px and 320px layouts without horizontal overflow, keyboard dismissal and no browser errors. All application services are running and public health is OK. The temporary acceptance workspaces were deleted. Screenshots: `/Users/vaibhav/Downloads/commons-discussion-2026-11-16`. Follow-up is tracked in PR #5 because PR #4 was already merged.

## Focused project contents and landing transition — 2026-11-16

Application revision `5a5e68f` is deployed on app and both workers with image `sha256:58382cc484404d21f3626544ca7248850ee04cd2cce681bd4424f08176086592`. Backup `backups/pre-contents-20261116.dump` was verified; rollback image `commons:pre-contents-7706cdf` is retained. No migration. The removed `src/app/loading.tsx` was explicitly removed from the archive-based server checkout before building.

Project overview renders and paginates pages/folders only. Stored attachments and notes remain available; the overview no longer queries them. Signed-in landing CTAs prefetch the workspace, and the global Opening Commons interstitial is removed.

Lint/typecheck, production build and three production-browser scenarios passed (landing, nested folders/discussion, inline media). The media scenario checks the pages-only list while uploaded files remain stored. Isolated local and hosted walkthroughs verified navigation without the loading-text flash with delayed workspace requests, file-only project empty state, pages-only contents after creation and retained file access. Hosted health is OK, all three services are running, and acceptance workspaces were removed.

## Landscape footer and public-route audit — 2026-11-16

Application revision `b5299f3` is deployed on app and both workers with image `sha256:dd26182b287b7aab9502e22dd3e6575ead30020b220b1dbc3906a17f59937531`. Verified backup `backups/pre-footer-20261116.dump` and rollback image `commons:pre-footer-5a5e68f` are retained. No migration.

The landing footer uses an original locally hosted meadow illustration (81KB WebP), a theme-aware fade, concise navigation and operator links. The image is decorative and lazy-loaded; mobile uses two small navigation columns. Source attribution is in public/landing/CREDITS.md.

Route auditing confirmed no remaining global loading interstitial. The first hosted walkthrough caught scroll/resize callbacks accessing detached landing refs during navigation; guards now stop those callbacks. The final production build, lint/typecheck and landing browser regression pass, including desktop/mobile Privacy round trips. Hosted acceptance verified artwork decoding, both themes at 1440/390/320px without overflow, Privacy/home/join/return transitions, public entry routes and authenticated Home/Agents/Explorer/Settings routes without the Opening Commons splash or browser errors. Health is OK and disposable review workspaces were removed. Screenshots: `/Users/vaibhav/Downloads/commons-footer-2026-11-16`.

## Footer attribution and Explorer retirement — 2026-11-16

Application revision `1ff5f0d` is deployed on app and both workers with image `sha256:4e4b133ddf4ba9c6ad52432cf382757d6e1bd060b644d948a22562b83635c5da`. Verified backup `backups/pre-navigation-20261116.dump` and rollback image `commons:pre-navigation-b5299f3` are retained. No migration. Deleted Explorer component files were explicitly removed from the archive-based server checkout.

HydraDB attribution is restricted to the landing footer with its original official symbol. Explorer navigation and visual UI are removed; old graph URLs redirect Home. Backend graph projection and agent context traversal remain intact. The heading reads Agents. All three homepage project photographs load eagerly; the footer landscape remains lazy-loaded.

Lint/typecheck, production build, landing and inline-media browser checks passed. The retirement regression passed after scoping the Settings assertion to the sidebar navigation (the profile also links to Settings; mobile navigation is hidden until opened). Hosted acceptance verified all three tab images loaded before selection, the Agents heading, absent Explorer links, old-route redirect, retained Settings navigation, and footer logo/link at desktop/390px/320px in both themes without overflow. Health is OK and the test workspace was removed.

## Mist social identity — 2026-11-16

Application revision `8f09890` is deployed on app and both workers with image `sha256:4c233dc1c29956e459d0ea9e0e12d7dd3428b0d9aa4cce0c1fe1d11500675812`. Verified backup `backups/pre-brand-20261116.dump` and rollback image `commons:pre-brand-1ff5f0d` are retained. No migration.

The 1200 × 630 OG/Twitter image uses the current landing headline, original meadow, Sora and Instrument Serif. SVG/ICO/Apple/installable icons share the Commons mark in slate on lilac. The brand archive and outlined wordmarks follow the current design system, including font licenses. The manifest uses the light canvas.

Lint/typecheck and production build passed. Local and hosted browser checks on Home and Privacy verified social metadata, versioned OG image URL, exact served image bytes, image dimensions, all favicon/Apple assets and manifest icon dimensions. All SVG exports render, the 16px favicon was visually checked, the zip matches source assets, and hosted health is OK.

## Compact project list titles — 2026-11-16

Application revision `18b1a86` is deployed on app and both workers with image `sha256:ece6a8dd43d23a44d46631bd08f4626b87092a1bf7c8554ffc80df626c8f0df8`. Verified backup `backups/pre-project-sizing-20261116.dump` and rollback image `commons:pre-project-sizing-8f09890` are retained. No migration.

Home project names use 15px Sora Medium with 36px icon tiles and tighter rows. Mobile disclosure arrows stay in the title row; nonempty counts sit below it and empty counts are hidden.

Lint/typecheck and the final production build passed. Local and hosted browser checks verified typography, icon dimensions, working navigation, both themes at 1440/390/320px, aligned arrows for empty and populated projects, no horizontal overflow and no browser errors. Hosted health is OK; the isolated review workspaces were removed.

## Inline folders and contextual menus — 2026-11-16

Application revision `1b048c6` is deployed on app and both workers with image `sha256:284f69de963e0545467edd71573ec7f6474bb360b94f4756dcc8b3ab06139e8d`. Verified backup `backups/pre-inline-folders-20261116.dump` and rollback image `commons:pre-inline-folders-18b1a86` are retained. No migration.

Folder creation uses the shared inline name field in the sidebar/mobile drawer. Parent branches expand automatically, Enter creates, Escape/outside pointer cancels, and a stable save key prevents duplicates on retry. Page menus contain page-specific actions, folder menus say New subfolder, and document pages no longer show add-child controls. Old folder form URLs return to their parent. Contents titles match the 15px project list, author metadata is 13px, and narrow project headers put actions below the title. OG artwork and its brand-kit copy omit the URL; social metadata uses a new image version.

Lint/typecheck and final production build passed. Production-browser scenarios cover inline projects, nested folders/list-board-table/discussion, and the new folder flow with IME, focus, cancellation, parent placement, mobile drawers, legacy URLs and retry after the server commits but the response is lost. The nested regression was updated to await the new folder heading because inline creation stays on the existing folder URL until success. Local and hosted walkthroughs verified 1440/390/320px in both themes, page-specific menus, Contents typography, no overflow and no browser errors. Hosted Home/Privacy metadata and image bytes match the URL-free artwork. Health is OK; temporary workspaces were deleted.

## Centered confirmations and optional agent types — local verification, 2026-11-16

Removed Home’s duplicate New project button; sidebar creation remains. All destructive browser flows now use the shared centered alert dialog, including pages/folders, files, notes, projects, workspace/account, agents, sessions, comments, invitations and other-session sign-out. Page/folder content remains behind the blurred backdrop. Typed checks and domain permissions remain intact.

Migration 010 adds optional agent identity. Enrollment and profile/owner edits validate the shared eleven-item landing catalog. Existing registrations and omitted identities stay neutral; names no longer guess a logo. Setup instructions and onboarding docs include the optional API field.

Verified lint/typecheck, production build, 18 Store tests, 5 HTTP MCP tests and 3 workspace/file/R2 tests. All 16 browser cases passed: the complete suite passed 15 and one timed out before application interaction during Chrome context setup; that case then passed alone. New regressions cover real delete/revoke effects, cancellation, validation errors, retained child pages, nested discussion confirmation, selected avatars, clearing identity and old-client enrollment. A separate local production walkthrough checked both themes at 1440/390/320px, copied setup instructions, browser enrollment with OpenAI Dots, owner clearing the identity, no duplicate Home creation button and zero page errors. Disposable review workspace removed.

Hosted verification: application revision `4d5a7bd` is deployed on app and both workers with image `sha256:3eb8e7837ff845edf83f3cc9c9f18663cfb64bcba2bf5dd80588d347d4e4879e`. Migration `010_agent_identity.sql` applied successfully and public health returns OK. Verified backup `backups/pre-confirmations-20261116.dump` and rollback image `commons:pre-confirmations-1b048c6` are retained. The live walkthrough verified all twelve selector entries (eleven identities plus neutral), copied setup instructions, mobile OpenAI Dots enrollment, persisted logo rendering, owner clearing the choice, revoke cancellation, sidebar creation and page confirmation context/focus/blur in both themes at 1440/390/320px. No browser page errors; final screenshots checked after dropdown animation and image decoding. Both disposable review workspaces were removed.

## Content summaries and readable selection — 2026-11-16

Application revision `1807814` is deployed on app and both workers with image `sha256:6bbbca7fceec4dab1e6e760079f04789b7b5504f9a8fa0fcebf9586ddc333e64`. Hosted health is OK. Verified Postgres backup `backups/pre-content-polish-20261116.dump` and rollback image `commons:pre-content-polish-4d5a7bd` are retained. No schema migration.

Home counts the complete metadata tree, splits pages from folders and omits hidden-upload/legacy-note counts and the Recently shared feed. Project actions expose Files. Legacy notes, collection records and uploaded originals are preserved. Selected text uses independent background/ink tokens; both reader and editor retain at least 7:1 contrast in light/dark themes.

Lint/typecheck and optimized build passed. Production browser regressions verify more than 50 records, folder/legacy-collection counts, file discovery, legacy data retention and reader/editor selection contrast, including links and table cells. The existing nested folder/list/board/table/discussion regression also passed. Hosted checks verified the page/folder counts, Files menu, absent legacy feed, linked Markdown tracker tables, dark selection colors and no horizontal overflow at 1440/390/320px in both themes. Live MCP context traversal returned ready, untruncated paths for three scenarios. The temporary project-scoped verification participant was removed afterward.

## Feedback recovery and product QA — local verification, 2026-11-17

Merged feedback/design-system PR #9 before the sweep. A real retry defect left a persistent error toast covering the next folder action after successful creation. Shared feedback now supports targeted dismissal; successful inline creation and editor recovery dismiss matching errors, and form notifications clear when resolved or unmounted. CONTRIBUTING now points to the current light/dark design authorities.

Validation: lint/typecheck and production build passed; 19 Store tests, 5 MCP tests, 4 workspace/file/R2 tests, 1 Hydra context test and all 17 production-build browser scenarios passed. The final browser suite used a fresh dedicated database, real PostgreSQL/R2/Hydra integrations and mocked Google identity only. It covers desktop/mobile, themes, keyboard controls, spacing, selection contrast, CRUD, uploads, folders and views, discussions, retry/idempotency, autosave conflicts, permission denial, revocation and destructive confirmation cancellation. Representative landing, settings, document, board and discussion screenshots were visually reviewed. This is bounded regression coverage, not an exhaustive accessibility, load or penetration audit.

Dependency audit reports four low-severity transitive findings in the editor math dependency chain; no high-severity production findings. No forced dependency downgrade was applied. The public landing was inspected separately; authenticated acceptance above ran locally. No VPS deployment was performed in this sweep.
