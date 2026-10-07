# Library Analytics connector — implementation and verification

Status on October 6, 2026: **incomplete; infrastructure deployed, live reporting
and ChatGPT installation are not verified.** Do not give this to volunteers as
a working connection yet.

## Library ownership and scope

- Google identity verified through Safari's account picker:
  librarycottonwood@gmail.com. The original `authuser=1` was Jaden, not the
  library; library is currently `authuser=7`. Inspect identity before use.
- Unbilled Cloud project: `cottonwood-library-analytics`. Analytics Data API
  enabled; no free trial, billing account, card, or paid API enabled.
- Dedicated reader:
  `library-analytics-reader@cottonwood-library-analytics.iam.gserviceaccount.com`.
  It has no Cloud project IAM roles. Analytics property **557596091** grants
  **Viewer, No Cost Metrics, No Revenue Metrics**. No account-level Analytics
  role was granted. Notification email was disabled.
- This is the **Cottonwood Library - Demo** property, tracking consented demo
  visits only. It cannot establish traffic to the existing public website.
- Worker account: `e05729fd6b6fad329e31896d8b1c2da9`, free plan.
- Endpoint:
  https://cottonwood-library-analytics.librarycottonwood.workers.dev/mcp
- OAuth KV namespace: `9041250d025b468aa265c1a81296ff2e`.
- Library-owned GitHub identity app: application **3910976**, public client ID
  `Ov23lif1ZStX5NHKSRrk`. It requests no GitHub scopes. Only the verified library
  login and numeric user ID **338888442** can finish the connector sign-in.
- Dedicated account token **Library Analytics checked deployments** grants
  Workers Scripts Write, Workers KV Storage Read, and Account Settings Read.
  This is account-scoped, not cryptographically limited to one Worker. Keep it
  in the trusted publisher; never the repair container. Existing Pages tokens
  were not expanded.

## Current human verification requirements

Google CLI setup opened a real **Verify it's you** prompt for the library
identity, asking for approval on its **Galaxy S22+**. One notification was sent.
The prompt displayed **56** at that time; this number and request can expire.
Do not resend or try alternate verification while Donna is unavailable. When
she is ready, start one fresh library sign-in if needed and report the number
actually displayed. The pending CLI process was stopped and its isolated
configuration, login log and code FIFO removed on the Mac; cleanup was verified.
Create a fresh isolated setup only when Donna is ready. No Google approval has
succeeded, and no valid Google credential is currently installed in the Worker.

GitHub requires **Confirm access**, signed in as **@librarycottonwood**, before
generating the identity-app client secret. It offers **Verify via email**. The
mailer has **not** been triggered; start it once only when the administrator is
ready to provide the library email code. Do not conflate it with Donna's Google
phone approval. This confirmation is also needed for saving repository secrets.

Two initial Google browser key downloads reported success but produced no file.
Both task-created keys were revoked; the reader key table was reloaded and
verified empty. Do not reuse those key IDs or leave additional orphan keys.

The Worker deployment token is temporarily in private setup storage on the Pi
at `/tmp/cottonwood-analytics-setup/cloudflare-token`, mode 0600, parent mode 0700.
This temporary location is needed only to finish setup. Move its value directly
into the library repository secret below, verify storage without displaying the
value, then remove this local copy. No token values are in source or this note.

## Finish credentials and installation

1. Complete isolated **library** Google CLI sign-in when Donna is available.
   Verify `gcloud auth list` identifies only the intended library setup identity
   in the isolated configuration. Verify project billing remains disabled.
2. Generate one service-account key directly into mode-0600 private setup
   storage; never stdout. Install only its private-key value as Worker secret
   `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`. The email is a nonsecret fixed binding.
   Keep this key out of the library editing environment and repair worker.
3. Complete GitHub email confirmation and generate the identity-app secret.
   Transfer it privately into Worker secret `GITHUB_CLIENT_SECRET`, without
   printing it, copying it into a chat, or taking screenshots of its display.
4. The random 256-bit `MONITOR_TOKEN` is installed in the Worker. Its private
   bootstrap copy is `/tmp/cottonwood-analytics-setup/monitor-token` (0600).
   Save that value directly as GitHub repository secret
   `LIBRARY_ANALYTICS_MONITOR_TOKEN`, then delete the bootstrap copy.
5. Store the dedicated deployment credential in the **library repository**
   secret `LIBRARY_ANALYTICS_DEPLOY_TOKEN`. Read back secret names only, never
   values. Credentials are never committed.
6. Install the remote server through the library's actual ChatGPT Plugins flow
   using OAuth. Verify identity and plan in that account. Use the library's
   Safari flow; root connector/plugin tools authenticate Jaden and cannot
   configure this account.
7. Prepare/publish library plugin version 0.1.2 from this branch only after the
   live reporting connection is verified. Preserve existing plugin ID, scope,
   release conflict checks, website handoff and default prompt. The source edit
   is prepared but **not published**.
8. Remove the temporary CLI sign-in and plaintext bootstrap material on both
   hosts after cloud secrets are verified. The final service does not depend
   on either computer staying on.

## Maintenance boundaries

Prepared workflows are not on main and are not enabled yet:

- `check.yml` adds credential-free connector tests and a Worker dry-run build.
- `analytics.yml` runs a small daily cloud probe at **16:47 UTC**. It checks
  health, denial of unauthenticated MCP access and a real read-only report.
  Its only credential is the restricted monitor credential. It stores status
  and a run URL under `.library-analytics-checks/` on `maintenance-reports`,
  never visitor figures. Reports include hosted source SHA and a fixed, plain
  human step/link for credential failures. A meaningful failure creates or updates
  one library-assigned issue, without an automatic permission/account change.
- The existing Plus repair worker permits connector protocol/formatting fixes
  and existing exact dependency version updates. Its repair container receives
  no Google key, Worker publisher credential, or monitor credential. Fixed
  authorization, report/property policy, credential renewal, deployment code,
  workflows and tests remain outside its patch allowlist.
- `analytics-deploy.yml` publishes only after current-main website/connector
  checks succeed. The trusted publisher retains the previous Worker version,
  verifies the hosted source SHA and live read-only connection, and restores
  the previous version if post-deployment verification fails. Deployment outcomes
  (verified, rolled back, not deployed, superseded or needs attention) are saved
  under `.library-analytics-deployments/` on `maintenance-reports`.
  The trusted publisher was also run against the real Worker: it deployed
  checked source, rejected the absent Google credential, automatically rolled
  back, and exact prior-version restoration was verified. A successful live
  report deployment and execution through GitHub CI still require rehearsal.
- Newer main source supersedes an earlier check. No automated workflow changes
  permissions, accounts, billing, Analytics settings, public website content,
  domains or DNS.

Cloudflare Free currently allows 100,000 Worker requests/day and 10 ms CPU per
request, plus 100,000 KV reads/day and 1,000 writes/day. Free quota exhaustion
fails rather than converting this setup into paid overage. Actual authentication
endpoint requests passed on the library free Worker. Google RSA signing/report
CPU and a full authorized ChatGPT exchange still require live verification.

The existing GitHub included-minute/storage limits and zero-dollar stop budget
remain applicable. Healthy checks make no model calls. The maintenance worker
and existing weekly assistant review share the library Plus allowance, not
OpenAI API credits. Do not create another weekly task.

## Evidence already obtained

- Actual library ChatGPT Plus Plugins → Add menu offers **Add custom MCP server**.
  This verifies plan/UI availability, not successful installation or tool use.
- Full GitHub cloud website/connector verification passed for branch commit
  `6d3e0602518359188358fef7765edd974f8f653c`,
  [run 37582035453](https://github.com/librarycottonwood/cottonwood-library-assistant/actions/runs/37582035453).
- Website check/build, release safeguards, consent/privacy checks and 36 page
  checks passed. Desktop and phone captures were inspected; website source
  remained unchanged.
- Trusted `publish.mjs` automatic-failure rehearsal passed on the real Worker:
  checked `7b096d63cfe49f76afbba4ff4dc41afdab7d7bb6` source was deployed, its
  live probe correctly rejected the missing Google credential, `rolled_back`
  was recorded, and exact previous 100% version
  `669a3b71-f5e1-4704-b81c-47b5208e410a` was restored and verified.
  This is the real trusted publisher, but not execution through GitHub CI or
  a successful live Analytics report.
- Actual Worker rollback to initial version and restoration of version
  `0038c945-db6d-4a07-abf7-6d2cab418b6b` passed; hosted health and source SHA
  were verified after restoration. This is infrastructure rollback evidence,
  not a live reporting/ChatGPT or automatic CI rollback test.

- Connector: **9 tests passed**, including real Workers runtime OAuth discovery,
  PKCE, consent-cookie binding, CSRF denial, script escaping, read-only protocol
  behavior, removal of OAuth tokens and arbitrary headers before the repairable
  protocol module, fixed aggregate request/property policy, date comparisons, missing
  data, bounded transient retries, permission errors and Google token renewal.
  The report fixtures are synthetic and do not establish real visitor totals.
- Maintenance: **11 boundary/vault tests passed**. Security files, scripts and
  credentials cannot be included in an automatic connector repair patch.
- Connector dependency audit: zero known vulnerabilities at setup time.
- Worker dry-run build passed; about 254 KiB uncompressed / 58 KiB compressed.
- Initial deployed version:
  `10916bf3-1805-4a19-a99b-7c95bc1971b4`, startup reported **3 ms**.
- Actual hosted health, OAuth server discovery and protected-resource metadata:
  HTTP 200. Actual unsigned MCP: HTTP 401 with `resource_metadata` and
  `analytics:read` challenge.
- Actual hosted dynamic client registration, browser-bound consent, forged-form
  denial and identity redirect passed. The redirect was not followed, so this
  test did not send another Google/GitHub verification request. A setup-test
  client and short-lived consent/upstream records were created in OAuth KV;
  abandoned clients automatically expire.
- Actual private hosted monitor probe returns `account_attention` for the absent
  Google reader key. This correctly requires account setup; it does not return
  invented zero visitors or establish a successful live report. The actual
  `check-live.mjs` runner also verified its account-attention output and recorded
  the currently deployed `6d3e0602518359188358fef7765edd974f8f653c` source SHA.
- Dashboard read-only baseline: September 29–October 5 displayed **1 active
  user, 25 views, 57 events and 1 Direct session**. These dashboard figures have
  **not** yet been compared with the API. The dashboard listed homepage 8 views;
  events/news 4; kids/families, book sale and visit/services 3 each; giving and
  our story 2 each.

## Still required before volunteer handoff

- Verify real API values against dashboard for exactly matching dates, timezone,
  report definitions and demo property; test directions_click separately.
- Test this week, last week, custom dates, like-period comparisons and a zero
  comparison denominator. Distinguish people, sessions and page views.
- Test a period before data existed, a filtered event with no records, invalid
  dates, and a genuine connection failure. No failure may be reported as zero.
- Finish actual library-account OAuth installation and validate a new ordinary
  Work chat asking Donna-style questions without manual plugin selection or a
  persistent special chat. Preserve the website-editing Codex handoff.
- Verify automatic connector token refresh and the service-account renewal path
  in the hosted runtime; inspect free-plan CPU outcomes without logging secrets.
- Run and verify the real daily GitHub probe, safe code-repair publishing path,
  hosted exact-source check and rollback rehearsal.
- Test whether the existing Monday cloud task can use the connector. Record the
  actual result; if it cannot, the verified daily probe report is a useful
  health source but does not prove scheduled live report access.
- Update the existing weekly task's saved prompt to inspect Analytics status,
  avoiding duplicate tasks. Keep the user's accepted brief healthy weekly
  update. The addition in `assistant/MAINTENANCE.md` is prepared, but the native task
  prompt has not been changed in this implementation yet. Requests belong in
  the existing pinned Weekly Maintenance Check chat and Scheduled; no immediate
  phone/email alert delivery is promised.

Official references:
[Google service-account authentication](https://developers.google.com/identity/protocols/oauth2/service-account),
[Google Data API quickstart](https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart),
[Cloudflare free-plan pricing](https://developers.cloudflare.com/workers/platform/pricing/),
[Cloudflare OAuth provider](https://github.com/cloudflare/workers-oauth-provider),
[ChatGPT custom MCP installation](https://developers.openai.com/api/docs/guides/custom-mcp-server),
[Worker rollback commands](https://developers.cloudflare.com/workers/wrangler/commands/workers/).
