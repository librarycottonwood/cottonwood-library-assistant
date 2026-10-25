# CMS publishing bridge

The library-owned publisher is deployed at https://cottonwood-library-cms-publisher.librarycottonwood.workers.dev/, with the real Sanity project `2ou0xy2r` / `production`, identity-only GitHub review app, scoped service connections and signed published-document webhook. The repository provider is `sanity`; see `CLAUDE.md`. Configuration is not proof of any website update: inspect the authenticated ledger, actual CMS workflow and hosted exact-version marker. Nonprofit approval, ChatGPT tool access and full recovery rehearsal remain separate handoff gates.

This Worker receives Sanity's signed **published** changes, records an operation durably, requests a checked website preview, collects an actual human approval, and requests publication of that exact saved release to the **live website only** (the `production` branch of the library-account `cottonwood-library` Pages project, https://cottonwood-library.pages.dev). Previews are separate immutable branch uploads on the same project. It never gives a content-drafting agent publishing authority. Publishing in Studio saves CMS content; it does not establish that the website is updated. Authenticated draft previews are not implemented by this bridge.

## Local evidence

Use Node 24:

```sh
npm ci --prefix cms-publisher --ignore-scripts
npm test --prefix cms-publisher
npm run build --prefix cms-publisher
node --test scripts/cms-publishing.test.mjs
```

`build` is a Wrangler **dry run**, not a deployment. The runtime suite sends HTTP requests through a real local Workers runtime and SQLite Durable Object; all outbound Sanity/GitHub/hosting responses are explicit provider stubs. The publishing helper tests include real local HTTP asset checks and a corrupt-upload/restoration rehearsal against a temporary HTTP server. They establish local security, state transitions, content pins and recovery logic. They do **not** establish real Google/GitHub sign-in, membership, Sanity delivery, private data access, GitHub dispatch, Cloudflare credentials or deployment, volunteer usability, ChatGPT tools, or notification delivery.

## Authority and configuration

`wrangler.jsonc` identifies the existing library account, project/dataset and publisher origin; it contains no credentials. Use Workers **Free** with the SQLite Durable Object migration; do not switch to a paid plan or enable paid overages. SQLite Durable Objects are available on Workers Free. Free quota exhaustion fails the operation rather than purchasing more capacity. No Workers AI, paid queue, or paid CMS plugin is used. The existing GitHub Actions minutes/storage and ChatGPT subscription remain separate quotas; keep the GitHub spending budget at zero and artifact retention short.

Create the Worker once as a library account owner, then use the current **Individual Workers Editor** role scoped only to `cottonwood-library-cms-publisher`. Do not select legacy Workers Scripts permissions or retain account-wide Worker administration for routine deployments. `CMS_PUBLISHER_DEPLOY_TOKEN` belongs in GitHub secrets. The checked-main-only deployment workflow preserves Worker secrets and verifies its hosted source/configuration; that health result does not establish end-to-end website publication.

| Setting | Owner / purpose |
| --- | --- |
| `PUBLIC_ORIGIN` | Exact deployed HTTPS origin of this Worker, without trailing slash. |
| `SANITY_PROJECT_ID`, `SANITY_DATASET` | The library-owned project and dataset chosen at the meeting. |
| `SANITY_WEBHOOK_SECRET` | Random secret of at least 32 characters, shared only with Sanity's webhook configuration. |
| `SANITY_READ_TOKEN` | Optional server-only **Viewer** token for a private dataset; never a mutation token. |
| `GITHUB_DISPATCH_TOKEN` | Library-owned token with only the required repository Contents read and Actions write permissions. Never exposed to ChatGPT or Studio. |
| `CMS_WORKFLOW_TOKEN` | Separate random 32+ character callback/receipt credential, also a GitHub Actions secret. |
| `CMS_STATUS_TOKEN` | Different random 32+ character service credential for status and read-only reconciliation. It cannot approve or publish an update. Reconciliation may request a preview. |
| `REVIEW_GITHUB_CLIENT_ID`, `REVIEW_GITHUB_CLIENT_SECRET` | Library-owned GitHub OAuth app; callback `${PUBLIC_ORIGIN}/review/callback`. Sign-in requests **no repository scopes**. |
| `REVIEW_SESSION_SECRET` | Separate random 32+ character HMAC key for short-lived HttpOnly review sessions. |
| `PREVIEW_HOST_SUFFIX` | Defaults to `cottonwood-library.pages.dev`, the live project whose immutable `<8hex>` uploads are previews. |

The identity-only OAuth check requires the existing library GitHub identity `librarycottonwood`, numeric ID `338888442`; a matching display name or email is insufficient. The upstream OAuth token is discarded. The review session lasts one hour, and sign-in state lasts ten minutes. The state is one-use, browser-cookie-bound and PKCE protected. Approval and fresh-preview requests require the signed session, same-origin POST, and CSRF token. Service bearer tokens are not browser sign-in or approval shortcuts.

GitHub repository **variables** are `LIBRARY_CONTENT_SOURCE`, `SANITY_PROJECT_ID`, `SANITY_DATASET`, and `CMS_PUBLISHER_ORIGIN` (the same exact value as Worker `PUBLIC_ORIGIN`). Keep `LIBRARY_CONTENT_SOURCE` unset or `local` until the real library account, imported content, roles and connections have been reviewed. Setting it to `sanity` enables the account-connected checks and CMS workflow. GitHub **secrets** are `SANITY_READ_TOKEN` (Viewer, when needed), `CMS_WORKFLOW_TOKEN`, `CMS_STATUS_TOKEN`, and the library-account Pages token `CLOUDFLARE_API_TOKEN` (legacy name `CLOUDFLARE_TRIAL_API_TOKEN` is used until it is re-added under the new name). Workflows map it to `CLOUDFLARE_API_TOKEN` only for their controlled upload steps, with `CLOUDFLARE_ACCOUNT_ID` fixed to the library account. The built-in GitHub job token is passed as `GH_TOKEN`; do not store it as a permanent secret. OAuth app/session keys and the GitHub dispatch token belong only in Worker secret bindings.

The content agent should have Sanity **Contributor** access for drafting. A library human publishes the CMS draft in Studio, then reviews the checked website. Do not give the drafting agent an Editor/Admin mutation token. Studio controls are not access-control boundaries; verify the actual membership roles in the library account. Nonprofit approval must be verified before relying on Growth/Contributor roles.

## Sanity webhook

Create the webhook only after reviewed content has been imported and settings are complete. Configure create/update/delete, published records only, drafts and versions disabled, POST `${PUBLIC_ORIGIN}/webhooks/sanity`, and the secret above. Narrow the filter to the library's content types:

```groq
_type in ["siteSettings","givingSettings","event","post","program","newsletter","notice"]
```

Projection (including the original revision on deletion):

```groq
{
  "projectId": sanity::projectId(),
  "dataset": sanity::dataset(),
  "documentId": coalesce(after()._id, before()._id),
  "documentType": coalesce(after()._type, before()._type),
  "documentRevision": coalesce(after()._rev, before()._rev),
  "operation": delta::operation()
}
```

The official `@sanity/webhook` verifier checks the untouched raw body. The bridge additionally enforces the millisecond timestamp window (10 minutes old / 1 minute future), rejects other datasets and unpublished namespaces, and deduplicates canonical event identities in strongly consistent storage. Unsigned delivery headers are not trusted as identity. It confirms the current document directly through Sanity's Doc API before queuing or approving, so late older deliveries cannot overwrite a newer revision. Permission-omitted documents are not treated as deletion.

Delayed deliveries beyond the signature window require reconciliation. The daily workflow calls authenticated `/reconcile`: it reads the current published revision vector (including referenced asset documents), coalesces missed changes into one new preview, and includes the current source SHA. Identical scans do not launch more jobs. Definitely-not-dispatched connection failures can retry once; uncertain GitHub dispatches are never blindly duplicated. Technical code repairs require fresh previews and approvals.

Each frozen snapshot also records `revisionDigest`, the SHA-256 of its sorted `{_id,_type,_rev}` vector. It is bound on the checked-preview callback and preserved in approval/callback receipts and the last-verified pointer. A first scheduled scan reuses a matching webhook-built preview or deployed release with the same complete revision vector and source; it does not ask for duplicate approval. Explicit human refresh still creates a new preview.

## Workflow contract

GitHub repository/workflow/ref are fixed: `librarycottonwood/cottonwood-library-assistant`, `cms.yml`, `main`. A source SHA is independently pinned in the input and trusted operation. The helper requires the complete credential-free `verify` job of `check.yml` to have passed for that exact main source; account reconciliation runs afterward to avoid a verification cycle.

Preview dispatch inputs:

```json
{"mode":"preview","operation_id":"UUID","document_id":"ID","document_revision":"REV","source_sha":"40_HEX","callback_url":"EXACT_OPERATION_RESULT_URL"}
```

Publish adds `content_digest`, `release_digest`, and `preview_run_id`. It obtains only the successful preview run's `library-cms-checked-preview` artifact, validates the complete frozen content, code, asset hashes and screenshots, checks the current full CMS digest, and reads the Worker approval receipt immediately before mutable upload. The Cloudflare project/account are fixed in the helper, the production branch must be `production`, and custom/public library domains cause refusal. Build and screenshot processes never receive publishing credentials.

Artifact paths under `output/`:

- `cms/operation.json`, `cms/snapshot.json`: operation pins and frozen **published** content; no credentials or drafts.
- `releases/<digest>/`: exact prepared site bytes and their SHA-256 manifest.
- `playwright/<digest>/`: actual checked desktop/phone screenshots and evidence.
- `cms/publish-result.json`: deployment/recovery outcome when a promotion was attempted.
- `cms/callback-result.json`: accepted safe library-facing status.

Callback POST `/operations/:id/result`, `Authorization: Bearer CMS_WORKFLOW_TOKEN`:

```json
{"stage":"preview_ready","sourceSha":"40_HEX","documentRevision":"REV","contentDigest":"64_HEX","revisionDigest":"64_HEX","releaseDigest":"64_HEX","previewRunId":"NUMERIC_RUN_ID","previewUrl":"https://8hex.cottonwood-library.pages.dev/"}
```

Stages are `preview_ready`, `build_failed`, `deploy_failed`, `deployed_verified`. After preview binding, callbacks must preserve all bound pins. `deployed_verified` also requires `websiteUrl` to be the fixed live website origin. The Worker independently fetches its hosted `/_review/status.json` and compares operation/source/content/release before recording success. If newer CMS content arrives during upload, it records the exact approved version actually hosted; newer changes require their own preview. No callback can manufacture browser approval, change hashes, or regress a verified result.

## Review, status and recovery

- `GET /review/:id`: authenticated human page with immutable preview and exact release digest.
- `POST /review/:id/approve`: actual session + CSRF approval of the exact pins. Concurrent double clicks dispatch once.
- `POST /review/:id/refresh`: actual session + CSRF request for a new current preview, useful after artifact expiry or a failed check. It supersedes the earlier preview and invalidates its approval. It cannot interrupt an in-progress publication. Refresh is limited to one per minute; duplicate submissions reuse the new operation.
- `GET /operations/:id`: `CMS_STATUS_TOKEN`; private status for the assistant/service.
- `GET /operations/:id/context`: `CMS_WORKFLOW_TOKEN`; exact immutable operation context for the trusted build.
- `GET /operations/:id/authorization`: `CMS_WORKFLOW_TOKEN`; current human receipt with all pins, live-website-only scope, and `previousVerified` recovery pointer. Manual workflow dispatch cannot bypass it.
- `POST /monitor`: `CMS_STATUS_TOKEN`; recent safe statuses and the last independently verified live release.
- `POST /reconcile`: `CMS_STATUS_TOKEN`; read-only CMS reconciliation, which may request one checked preview but cannot approve or publish it.

`contentPublished` / `contentState` refer to CMS availability; `deployedVerified` is separate. Raw provider errors, tokens, document identifiers and operation URLs are never returned by the public webhook endpoint. Operation IDs are random UUIDs and there is no public operation listing.

The last verified pointer includes operation ID, code/content/release pins, immutable preview URL, preview-run ID and verification time. Before another promotion, the helper reconstructs the preceding site from that immutable preview and verifies every original asset hash, plus retained PNG/evidence hashes, within a 100 MB total recovery limit. Failed hosted verification attempts restoration of those exact earlier site bytes and verifies the restored result. The safe review HTML/metadata is regenerated; original public site assets are unchanged. The Worker verifies the previous hosted status before explaining that restoration succeeded. Failed restoration remains an explicit failure. The first live release has no predecessor; the authenticated hosting inventory must prove no production deployment exists, and failure never claims a restoration.

Completed history is pruned after 90 days / 500 completed records; waiting operations are retained for investigation. Missing credentials, nonprofit/role problems, exhausted quotas, ambiguous dispatches, expired artifacts, and lost provider access require the actual library-account rehearsal and a clear next step. This code does not promise that AI can repair credentials or that a ChatGPT push notification has been delivered. The existing maintenance system must exercise its real repair, deployment and explanation paths before December handoff.

## Sources

- [Sanity signed webhook practices](https://www.sanity.io/docs/content-lake/webhook-best-practices)
- [Official signature toolkit](https://github.com/sanity-io/webhook-toolkit)
- [Direct document reads](https://www.sanity.io/docs/http-reference/doc)
- [Cloudflare Free Durable Objects and limits](https://developers.cloudflare.com/durable-objects/platform/pricing/)
- [Cloudflare deployment inventory](https://developers.cloudflare.com/api/resources/pages/subresources/projects/subresources/deployments/methods/list/)


## PR previews and saves

Routine website updates follow the save flow in `.claude/skills/website-save/SKILL.md`: current-content PR preview URL, explicit chat approval, merge, and verified exact-asset publication through `publish-live.yml`. The reporting connector has no website tools/scopes or publisher service binding. PR35/36's in-chat MCP detour was retired without a successful account rehearsal. Do not reconnect Analytics to obtain publishing access.

The existing `cms.yml` ledger/review workflow remains available for explicitly chosen administrator CMS recovery. PR and CMS publication share the `library-live-publishing` lock and hosting/rollback helpers. `POST /source-release`, authenticated with the existing workflow callback token, records an already deployed PR release only: it checks current main, identical PR/main Git trees and the hosted status pins. It cannot approve or dispatch a publication. The status retains the preview source SHA and records `mergedSourceSha` separately. Reconciliation recognizes this verified merged tree, avoiding another approval for the same source/content.

Publisher deployment now waits within a bounded interval for the expected configured health version and reports the observed public status/SHA or HTTP failure. The October 22 failed deployment logged no underlying cause, so propagation is a plausible failure mode, not a confirmed diagnosis. Rollback verifies the previous health source. Analytics deployment no longer waits for a publishing entrypoint. Publisher retirement waits until the reporting health response confirms its caller binding was removed, following Cloudflare’s service-binding deployment order; subsequent publisher versions have no reporting SHA dependency.

All connector code/dependencies remain excluded from automatic repair. Website components/layout/styles and the explicitly allowed CMS adapter files retain their previous bounded repair scope. No public-domain launch, new account/connector, DNS change or paid service is included.
