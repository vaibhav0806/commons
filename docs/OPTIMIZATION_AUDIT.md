# Discovery, performance and activation

November 18, 2026. This batch does not add the proposed onboarding guide. Owner: Commons maintainer. No third-party analytics service or browser session recording is introduced.

## Search discovery

Before this change the homepage inherited the root layout's `noindex, nofollow`. Docs and Privacy opted into indexing, but Privacy had no canonical and docs inherited generic social copy. There were no sitemap or robots routes.

- The homepage, Privacy and the four existing docs pages have self-canonicals, descriptions, index/follow and page-specific Open Graph/Twitter metadata.
- `/sitemap.xml` lists only those public routes. It uses the docs registry, never workspace/database records. No fabricated last-modified dates.
- Sitemap and robots resolve `APP_URL` at request time so a Docker build cannot freeze localhost into production URLs. Production must configure its canonical HTTPS origin.
- `/robots.txt` discourages crawling workspace, enrollment, authentication, API and MCP routes. Those routes also emit `X-Robots-Tag: noindex, nofollow, noarchive`. Root metadata remains noindex by default; public pages opt in.
- Authentication and scope checks remain the privacy boundary. Robots rules do not make content private and do not guarantee a URL disappears from search. Unknown docs return 404/noindex.
- Search Console coverage and actual search rankings were not accessible or verified. After deployment, submit the sitemap and inspect the homepage/public docs in Search Console.

References: [Google's indexing guidance](https://developers.google.com/search/docs/fundamentals/get-started), [canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap). Framework behavior was checked against installed Next.js 16.4.6 metadata and image documentation.

## Performance evidence

Measured through the collaborative Chromium browser at 390 × 844 CSS pixels, DPR 2, desktop user agent, no CPU/network throttling. These are lab observations, not physical-device or field-percentile results.

| Measurement | Baseline |
| --- | --- |
| Live anonymous landing TTFB | 205 ms |
| Live landing first contentful paint / LCP | 340 / 340 ms (heading) |
| Live landing load event | 1,493 ms |
| Slowest live resource | `studio.jpg`: 1,240 ms, 173,168 body bytes |
| Local production workspace → project → workspace → project → workspace | 71 / 33 / 33 / 34 ms |

Navigation measured from link click until the target path committed plus two animation frames. Same local signed-in owner, one existing project. The same four transitions after the change took 56 / 33 / 33 / 33 ms. The test does not establish performance for large projects or remote authenticated users. No production account data was modified.

The largest observed request delay was the full-size story image. All three story images now use Next Image with responsive sizes and WebP negotiation. Eager loading is retained for all three so changing tabs does not wait for an image request. Dimensions preserve layout.

At the 318px rendered mobile width/DPR 2, the browser selects 640px variants:

| Asset | Original body bytes | Optimized body bytes |
| --- | ---: | ---: |
| Kyoto | 104,566 | 39,304 |
| Studio | 173,168 | 51,728 |
| Fieldnotes | 34,695 | 7,966 |
| Total | 312,429 | 98,998 |

The selected image payload falls **68.3%**; Studio falls **70.1%**. The preview's first navigation also fetched 256px variants during viewport initialization (22,620 additional bytes), making that observed total 121,618 bytes, still **61.1%** smaller. Do not hide those duplicate requests when reporting the run.

Local baseline: TTFB 45ms, LCP 136ms, load 116ms. First optimized request: TTFB 129ms, LCP 180ms, load 344ms; cold image transformations took 166–192ms. These noisy single local samples do **not** demonstrate a load-time improvement. A warm reload had 14ms TTFB and 38ms load, but restored-scroll LCP was not comparable. The verified improvement is transferred image size; check cold and warm production timings after deployment. [LCP measurement reference](https://web.dev/articles/lcp).

## Activation contract

Question: where do new workspaces stop before two agents successfully share context?

Baseline measurement-readiness diagnostic: **55/100, unreliable** (decision alignment 25/25, event clarity 15/20, integrity 0/20, conversion definition 15/15, attribution 0/10, governance 0/10). There was no activation instrumentation to support conversion claims. This implementation adds a prospective, transactional cohort and tests, not retroactive estimates or a claim of verified production conversion rates.

`workspace_activation` is one row per workspace created after migration 011. Its milestone columns are equivalent to these events:

| Milestone | Trigger | Counting |
| --- | --- | --- |
| Workspace created | Successful Google/local-owner creation or workspace reset | Once per new workspace ID |
| First agent connected | First successful enrollment transaction | Once, not invitation creation |
| Second agent connected | Second distinct successful enrollment transaction | Once; concurrent joins serialize on the cohort row |
| Second agent reads existing context | The second registered agent successfully retrieves nonempty context from someone else | First qualifying read only |

Qualification:

- MCP `read_page`, `read_note`, `read_project`, and `catch_up`; file bytes from `read_file(includeContent=true)` or the authenticated file download endpoint.
- Browser page/project content is recorded only after its component mounts in a visible document. Server rendering and route prefetch alone do not count. The server rechecks authentication, project scope, author and nonempty content.
- A project brief is owner-managed, so a nonempty brief is context from someone else. Pages/notes/files authored by the reader do not qualify. Names and metadata alone, list/search calls, empty pages, invalid or denied requests do not qualify. `catch_up` qualifies because it returns bodies, including the Commons page when available.
- This measures successful retrieval, not understanding, task completion, or proof the client received every network byte. A disconnect after server success can still count. A client with blocked JavaScript may undercount browser reads.
- "Second" means the second successful agent registration in that workspace, not any later agent or two concurrent sessions. Reconnecting a saved credential is not a new registration. A new invitation creates a distinct registration even if it uses the same provider/name.
- Later removal does not rewrite historical timestamps or promote a third agent to second. Agent IDs become null if their registration is physically deleted. Workspace deletion cascades to remove the cohort; reset creates a fresh one.
- Existing workspaces are excluded: historical reads and their original enrollment sequence cannot be reconstructed reliably. No synthetic backfill.

Stored fields: workspace ID, first/second agent IDs, four timestamps. No document bodies, titles, resource IDs, emails, names, provider identities, URLs, prompts, tokens, invitation codes, IP addresses, or user agents. No arbitrary event-property JSON. These records remain in the existing PostgreSQL database, are not exported to a vendor, and are removed with the workspace. Privacy copy describes this collection.

### Query the funnel

Run read-only SQL on the deployment database; choose a creation cohort window. Example is the last 30 days of instrumented workspace creation, including resets. Retention excludes deleted workspaces, so this is a surviving-workspace funnel, not a permanent acquisition ledger.

```sql
SELECT
  count(*) AS workspace_created,
  count(first_agent_connected_at) AS first_agent_connected,
  count(second_agent_connected_at) AS second_agent_connected,
  count(second_agent_context_read_at) AS second_agent_read_context,
  round(100.0 * count(second_agent_context_read_at) / nullif(count(*), 0), 1) AS activation_percent,
  percentile_cont(0.5) WITHIN GROUP (
    ORDER BY (second_agent_context_read_at - workspace_created_at) / 1000.0
  ) FILTER (WHERE second_agent_context_read_at IS NOT NULL) AS median_seconds_to_activation
FROM workspace_activation
WHERE workspace_created_at >= extract(epoch FROM now() - interval '30 days') * 1000;
```

Changes to event definitions must update this document and the integration tests together. Do not add content or credentials as analytics properties. No UI dashboard or paid analytics product is needed for this first deliverable.

## Validation and rollout

- Apply migration 011 before running new application code (`npm run db:migrate`; normal container startup already runs migrations).
- `npm run check` and `npm run build`.
- `node --env-file=.env.local --import tsx --test tests/store.test.ts tests/mcp.test.ts tests/activation.test.ts tests/workspace-content.test.ts`.
- With the local production server running against `.env.local`: `TEST_BASE_URL=http://localhost:3007 node --env-file=.env.local --import tsx --test tests/discovery-http.test.ts`.
- HTTP checks cover public canonicals, sitemap allowlist, unknown docs, private robots headers/authentication, same-origin and scope checks, strict payload validation, prefetch exclusion and read deduplication. Store/MCP tests cover concurrent joins, replay, empty/own context, cross-workspace reads, repeated reads, revocation and deletion/reset.
- Visually check mobile story images and tab switching. Verify production sitemap origin, noindex response headers and cold/warm image timings after deploy. This PR itself does not deploy or submit to search engines.
