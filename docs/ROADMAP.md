# Commons implementation

Approved scope: deliver the local product end to end. The design review is complete. Only the human Google identity is mocked; database persistence, authorization, browser sessions, invitations, notes, requests, catch-up, MCP and revocation are real.

## Implementation sequence

1. Replace the preliminary SQLite/email-code scaffold with PostgreSQL, explicit versioned SQL migrations, opaque hashed sessions and a loopback-only local owner identity. Start Postgres with Docker Compose. Use the installed Node 24 LTS runtime.
2. Implement one shared domain service for project visibility, atomic invitation redemption, notes/references, eligible mentions, per-recipient acknowledgement, completion, result notes, read state, search, activity and agent revocation. Browser actions and MCP call this same service.
3. Build the approved application screens with real server reads/actions. Preserve the sign-in illustration; remove study navigation, sample workspace controls, fake data and obsolete source comments from the shipping app. Keep design studies outside the product runtime as reference material.
4. Expose authenticated Streamable HTTP MCP using the installed official SDK. Public enrollment is separate from protected tools. Enrollment returns a bearer credential that clients explicitly retain; do not promise automatic configuration or OAuth support.
5. Run database authorization and concurrency tests, actual SDK HTTP client tests including reconnect and revocation, and independent owner/browser-agent sessions for the shared handoff. Run typecheck, lint, production build and browser checks at desktop/mobile widths.
6. Document real setup, supported connection steps, the Google mock boundary and any remaining limitations.

## Decisions for this implementation

- Use node-postgres and explicit SQL migrations instead of introducing an ORM while replacing the incomplete store. Keep SQL and transaction boundaries visible.
- Pair each visible six-digit code with an unguessable invitation identifier in its copied URL. Codes expire after ten minutes and are consumed atomically.
- Use static bearer authentication for the local MCP proof. OAuth discovery, token refresh and universal host compatibility are not claimed.
- Preserve content attribution after revocation. Remove active credentials immediately; retain shared contributions.
- Keep the local Google identity behind explicit configuration and loopback origin validation. Do not permit that mock in an externally hosted configuration.

## Review focus

Cross-project/workspace resource and participant leaks; concurrent and repeated invitation redemption; stale credentials after revocation; request recipients losing access; duplicate write retries; read versus acknowledgement versus completion; safe rendering of contributed text; focus return and reduced motion.

## Completion evidence

Completed the local scope above. The application runs on port 3007 with Docker Postgres; browser and MCP use real shared records. Verified the official SDK MCP client, independent browser agent and persisted handoff in development and optimized production. Typecheck, lint, build and the database/protocol/browser suites pass. The working database is separate from automated test data.

See CONTRIBUTING.md for executed checks and reproducible setup. Google identity remains mocked by explicit request. Native provider certification, hosted deployment, license selection and public-release policy are outside this local completion.

## Hosted testing iteration

- Implemented returning with a saved credential, 90-day inactivity renewal, and browser cookie refresh. Revocation still invalidates all entrances.
- Implemented explicit related-context retrieval with HydraDB, Postgres authorization and outage fallback.
- Added the private single-owner testing entrance and container deployment configuration.
- Native provider handoff/return checks remain a separate acceptance step; SDK and browser tests do not certify them.
- Keep Google OAuth, public-release hardening, licensing and broader release decisions for the final release phase.
