# Library Analytics connector — implementation and verification

Status on October 7, 2026: **incomplete; infrastructure deployed, live reporting
and ChatGPT installation are not verified.** Do not give this to volunteers as
a working connection yet.

## Library ownership and scope

- Google identity verified through Safari's account picker:
  librarycottonwood@gmail.com. The original `authuser=1` was Jaden, not the
  library; library is currently `authuser=7`. Inspect identity before use.
- Unbilled Cloud project: `cottonwood-library-analytics`. Analytics Data API
  enabled; no free trial, billing account, card, or paid API enabled.
- Historical unused service-account reader:
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
Create a fresh isolated setup only when Donna is ready. No Google report grant has succeeded. The production browser client is configured
in the Worker; a real report is still unverified. The old CLI setup is obsolete.

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

1. Prefer the new secure browser reconnect once its hosted readiness is verified.
   The administrator chooses only librarycottonwood@gmail.com and approves the
   read-only Google connection when ready. If Google needs Donna, request phone
   approval once and wait. Do not use the obsolete CLI/key-download setup as a
   volunteer workflow. A successful fixed-property read must precede success.
2. Complete GitHub email confirmation and generate the identity-app secret.
   Transfer it privately into Worker secret `GITHUB_CLIENT_SECRET`, without
   printing it, copying it into a chat, or taking screenshots of its display.
3. The random 256-bit `MONITOR_TOKEN` is installed in the Worker. Its private
   bootstrap copy is `/tmp/cottonwood-analytics-setup/monitor-token` (0600).
   Save that value directly as GitHub repository secret
   `LIBRARY_ANALYTICS_MONITOR_TOKEN`, then delete the bootstrap copy.
4. Store the dedicated deployment credential in the **library repository**
   secret `LIBRARY_ANALYTICS_DEPLOY_TOKEN`. Read back secret names only, never
   values. Credentials are never committed.
5. Install the remote server through the library's actual ChatGPT Plugins flow
   using OAuth. Verify identity and plan in that account. Use the library's
   Safari flow; root connector/plugin tools authenticate Jaden and cannot
   configure this account.
6. The recovery-only library instruction update is already installed as 0.1.2.
   Publish the additional source report-tool guidance only after actual live
   reporting is verified; preserve the existing plugin ID and website handoff.
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

- Existing weekly cloud task Analytics prompt saved and exactly read back;
  title, original instructions, active state and Monday weekly afternoon cadence
  preserved. One native Run now completed in pinned Weekly Maintenance Check.
  It correctly reported healthy website plus unfinished Analytics setup,
  distinguishing Google phone approval from GitHub confirmation. It did not
  attempt a repair or repeat verification. This verifies setup/source reading,
  not installed MCP access or future activated daily/deployment record access.
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

- Connector: **17 tests passed**, including real Workers runtime OAuth discovery,
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
  Google report grant. This correctly requires browser approval; it does not return
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
- Verify automatic connector token refresh and the Google grant renewal path
  in the hosted runtime; inspect free-plan CPU outcomes without logging secrets.
- Run and verify the real daily GitHub probe, safe code-repair publishing path,
  hosted exact-source check and rollback rehearsal.
- Test whether the existing Monday cloud task can use the installed connector
  and read activated daily/deployment records. The source/setup inspection
  rehearsal passed, but does not prove scheduled live report access. Requests
  belong in the existing pinned Weekly Maintenance Check chat and Scheduled;
  no immediate phone/email alert delivery is promised.

Official references:
[Google browser OAuth](https://developers.google.com/identity/protocols/oauth2/web-server),
[Google Data API quickstart](https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart),
[Cloudflare free-plan pricing](https://developers.cloudflare.com/workers/platform/pricing/),
[Cloudflare OAuth provider](https://github.com/cloudflare/workers-oauth-provider),
[ChatGPT custom MCP installation](https://developers.openai.com/api/docs/guides/custom-mcp-server),
[Worker rollback commands](https://developers.cloudflare.com/workers/wrangler/commands/workers/).

## Guided recovery implementation (October 7)

The installed private library instruction plugin is now version **0.1.2**, release
`pluginrel_6ac5f70e34cc8191aee85961fec6e715`. Parent verified actual library
readback and fresh ordinary Work chat
`6ac5f733-b368-83e8-bc3e-68d3d4528329`: it automatically gives one Google-account
identity step/link, distinguishes signed-in status from unfinished setup, explains
separate GitHub confirmation, and refuses key pasting without claiming the secure
connection screen is ready. It does not prove installed live report tools.

New trusted recovery modules are `recovery.mjs`, `google-user.mjs` and
`reconnect.mjs`. GitHub identity/MCP authorization is separate from the single
Google browser-grant reader. The unused service-account fallback and key-specific
diagnostics/tests were removed; no live permissions were changed. The encrypted
Google grant can be renewed server-side
and replaced through a human-started browser reconnect. It is disabled until a
library Google client, client secret, 256-bit grant encryption key and verified
production flag are configured. External Testing grants are deliberately
unsupported: Analytics-scope refresh tokens expire after seven days in that mode.
Production for this known single-library-account app avoids that forced weekly
expiry, but revocation and Google security checks can still require human approval.
An unverified warning can still appear under Google's small/personal-use exception;
actual consent/warning screens have not been tested. No public distribution or
verification submission was requested.

The browser flow binds state and PKCE to an HttpOnly secure cookie, verifies the
Google userinfo email and email_verified, and runs a real fixed-property read before
replacing the encrypted old grant. Wrong accounts, cancellation, expired state,
invalid client, revoked grant and denied report access preserve the prior grant.
No permissions API is called. A read-only connection-status MCP tool returns one
next step/link and succeeds only after a real report. It cannot repair a missing
client by ordinary login. The daily/weekly status path
records classified causes and reconnect readiness, never counts or credentials.

Fixtures: **17 tests passed**, including temporary-token expiry/renewal, revoked
Google grant, canonical daily/live recovery instructions, invalid client, CSRF/PKCE/state expiry, wrong account, denied consent,
failed report before replacement, access removal/restoration and error privacy.
Existing 11 repair-boundary tests still pass. These are isolated synthetic tests;
no live reader key, account access or permission was revoked.

Library Cloud project Google Auth Platform was initially unconfigured. Branding
was created using library-only support/contact email, a Web client with exactly
`https://cottonwood-library-analytics.librarycottonwood.workers.dev/google/callback`,
and no JavaScript origins. Production status was set and read back as **In production**, in the verified
library account. Branding uses the connector homepage, privacy and terms links,
without launching a public library website. Actual Google approval/grant and
possible unverified-warning screens still need the administrator.
The reader keys table was verified empty. No Google phone request was sent.

Security correction: a newly created, unused OAuth client secret appeared in a
copy button aria-label inspection. That client was immediately deleted; Google's
confirmation says it can no longer make API requests, and the active client table
was verified empty before replacement. Do not restore the deleted client from
Google's 30-day recovery list. The replacement client was captured directly into
private 0600 setup storage, without displaying or screenshotting its secret.
Its secret and a new 256-bit grant encryption key were then stored in Worker
secrets, their names verified, and the task Google client plaintext/bootstrap
files deleted. No local encryption-key copy was created.
Its public ID is `752467633750-bq3om43561a83qvocko763cicfahu79p.apps.googleusercontent.com`.
Only this replacement may be configured. No active library credential was changed
by that deletion, and the exposed client was never installed or granted access.

Official recovery references:
[Google refresh-token expiry](https://developers.google.com/identity/protocols/oauth2),
[Google web-server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server),
[Small/personal-use verification exception](https://support.google.com/cloud/answer/13464323?hl=en),
[Private Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/).

Hosted recovery activation: full cloud check for `9a6bed8a6b731444676850bed545f30c66f7f9e2`
[passed](https://github.com/librarycottonwood/cottonwood-library-assistant/actions/runs/37590051143),
and that source was deployed. Actual `/reconnect` returns 200 with its Google
button, `/monitor` correctly returns 503 `reader_missing` plus
`keylessReconnectReady: true` and the exact reconnect link. This proves secure
reconnect configuration, not approved Google access or restored reports.

A subsequent real Chromium fixture exposed a browser Origin/privacy-header
incompatibility, now fixed with `strict-origin` (no query leakage) and a
`form-action` allowance restricted to self and accounts.google.com. The browser
fixture passed cookie/CSRF/PKCE/navigation with every hop intercepted through CDP
and DNS disabled; no Google network or human approval can occur in that test.
It is included in exact-source cloud checks and credential-free repair verification.
The final browser-header revision requires its own cloud check/deployment gate.

Current next human step is the secure reconnect button using the library Google
identity when the administrator/Donna are ready. No phone approval was requested
by this implementation. GitHub identity-app confirmation/secret, actual library
ChatGPT report-plugin installation, real report/dashboard verification and
scheduled live MCP access remain separate unfinished gates.

## Canonical-path cleanup (October 7)

Reports use only the encrypted library Google browser grant; no JWT/key reader
fallback remains in runtime or configuration. GitHub identifies the permitted MCP
caller; Google authorizes read-only Analytics. These are separate security
boundaries. Browser reconnect intentionally validates its newly approved token
before saving it; normal reports refresh the saved grant. Both are trusted paths,
not interchangeable repair code. Daily human steps now come from `recovery.mjs`,
the same policy used by the live diagnostic tool; the workflow stores that output
instead of maintaining a second instruction map. The private monitor independently
checks the hosted reader because it must work even when ChatGPT sign-in is broken.
The unused service account remains in the account inventory as historical unused
setup; this code cleanup does not change account roles or permissions.
