# Library Analytics connector

This Worker is a remote MCP server that answers visitor-report questions from the library's Google Analytics property (`src/content/analytics.json`, property `557596091`) for the library's ChatGPT. It is read-only. It is deployed by `analytics-deploy.yml` and checked daily by `analytics.yml`. The whole connector is outside automatic repair: changes need reviewed technical work.

- Endpoint: https://cottonwood-library-analytics.librarycottonwood.workers.dev/mcp (Worker `cottonwood-library-analytics` on the library's Cloudflare account, free plan; configuration in `wrangler.jsonc`).
- In ChatGPT it is a custom MCP connection in the library account. Keep its permission on **Allow read-only tools**; never "Allow all".
- Account owners and sign-ins are in the private account directory in the library ChatGPT Maintenance project (Sources), not here.

## How access works

- **Who may call it:** GitHub sign-in through a library-owned identity-only OAuth app (no repository scopes). Only the library's GitHub account can finish the connector sign-in (`src/index.mjs`).
- **How it reads Analytics:** an encrypted Google browser grant for the library Google account, renewed server-side. There is no service-account or key-file reader.
- **Reconnect:** when Google access is revoked or expires, `/reconnect` starts a fresh browser approval with the library Google account. It checks the account, runs a real read of the fixed property, and only then replaces the saved grant; a wrong account, cancellation or failed read keeps the old grant. `src/recovery.mjs` holds the one next step for each failure, used by both the live status tool and the daily check. Never ask anyone for passwords, codes or keys in chat.

## Secrets (names only)

- Worker secrets: `GITHUB_CLIENT_SECRET`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_TOKEN_KEY` (grant encryption key), `MONITOR_TOKEN`.
- GitHub repository secrets: `LIBRARY_ANALYTICS_DEPLOY_TOKEN` (Worker deploys), `LIBRARY_ANALYTICS_MONITOR_TOKEN` (daily probe).
- Public client IDs live in `wrangler.jsonc`. Secret values never go in source, chat, screenshots or reports.

## Maintenance

- `analytics.yml` (daily, 16:47 UTC) checks health, denial of unauthenticated MCP access and a real read-only report using only the monitor token. It stores status and the next human step under `.library-analytics-checks/` on `maintenance-reports`, never visitor figures, and keeps one issue open while access needs attention.
- `analytics-deploy.yml` publishes only after current-main checks pass and only when `connector/` changed since the hosted source. It keeps the previous Worker version, verifies the hosted source SHA and a live report, and rolls back a failed update. Outcomes go to `.library-analytics-deployments/` on `maintenance-reports`.
- No workflow changes permissions, accounts, billing, Analytics settings, website content, domains or DNS.
- Cloudflare Free allows 100,000 Worker requests/day and 10 ms CPU per request, plus 100,000 KV reads and 1,000 writes/day. Running out fails rather than billing.

## Reporting rules

A failure is never reported as zero visitors. Keep people, sessions and page views distinct, state the date range and timezone, and say when a period has no data yet. Local tests use synthetic fixtures; they do not establish real visitor totals.

References: [Google web-server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server), [Google Analytics Data API](https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart), [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Cloudflare OAuth provider](https://github.com/cloudflare/workers-oauth-provider), [ChatGPT custom MCP](https://developers.openai.com/api/docs/guides/custom-mcp-server).
