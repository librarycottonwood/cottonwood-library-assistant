# Library content management

## Current state and ownership

The library owns Sanity project `2ou0xy2r` (Cottonwood Community Library), dataset `production`. The editor (Studio) is hosted at https://cottonwood-community-library.sanity.studio/. Account owners, sign-ins and recovery are in the private account directory in the library ChatGPT Maintenance project (Sources), not in this repository.

**The repository provider is `sanity`.** The library-owned publisher, identity-only GitHub review app, scoped dispatch/deployment connections and signed published-document webhook are configured. The publisher is https://cottonwood-library-cms-publisher.librarycottonwood.workers.dev/. Read its authenticated status or the actual CMS workflow report before claiming a preview or verified website update; configuration and CMS publication alone are insufficient. The official Sanity plugin is connected in the library ChatGPT account. Check the installed connection before promising access; source edits do not update the account.

Keep ownership with the library's account and a second library administrator/recovery path. Runtime publishing never depends on a personal computer or account.

**Additional recurring budget: $0.** Do not add a card, enable overages or assume a paid plan. The existing ChatGPT sign-in handles bounded technical upkeep; no paid OpenAI API is introduced. Do not enable Sanity image generation/transformation tools. GitHub/Cloudflare allowances remain finite and must stop before paid overage.

## Shared content sources

When `LIBRARY_CONTENT_SOURCE=sanity`, the website reads one validated, published-content snapshot for a whole build. Missing configuration, broken references, unavailable content or invalid data stop that build. They never silently substitute the prototype's old content.

| Edit in Studio | Used by the website |
| --- | --- |
| One event with confirmed sessions | Homepage coming up, events agenda, event detail, referenced news posts |
| One program | Shared recurring program descriptions and pictures; no invented dates |
| One blog post | News feed and article, rich text, cover/gallery, event references |
| Newsletter PDF, cover and Word version (accessible) | Current issue selected in settings; old issues remain in the archive. The Word version is offered for download next to the PDF ([newsletters](content/newsletter.md)) |
| Notice with Pacific first/last dates, plus closed days or "stays open" | Shared notice banner; closed days drop regular-program sessions ([notices](content/notices.md)) |
| Library settings and hours | Shared contact details, map/address, page copy; phone link and hours summary derive automatically. The header and footer menus come from `src/components/site/navigation.ts` (a code change), not Sanity; the Settings "Main navigation" field is not used by the website |
| Giving and acknowledgments | Ways to help, thank-yous and approved Givebutter widget identifiers |

Each confirmed event date requires both a start and an end time, with the end later than the start. Upcoming agenda rows, day groups and featured pictures recheck the confirmed end time in the visitor's browser, including after a tab resumes. Events stay listed while they are happening and stop being promoted after they end, between builds; their historical detail pages remain available. This does not modify CMS records or replace the approved release.

Payments, donors and live fundraising totals stay in Givebutter. Donor data, passwords, keys, private board records and personal details do not belong in public website documents. Public Sanity datasets expose published documents and original uploaded assets even when a website does not link them. The website emits resized, metadata-free images; check Sanity's treatment of **original uploads** during the live rehearsal before claiming the entire upload pipeline removes private metadata.

The local provider remains available for isolated fixtures and explicit recovery work; ordinary connected publishing uses `LIBRARY_CONTENT_SOURCE=sanity`. Its seed/editorial files are migration inputs. After activation, volunteers edit the CMS; do not also update those files for ordinary publishing. Code/layout work stays in reviewed GitHub changes.

## Volunteer workflow

Gather facts with the topic wizard. Read current records and schemas through the existing Sanity connection; create/correct a draft without overwriting unrelated content. Show its proposed title, description and dates in chat. After confirmation, use the supported Sanity document publishing tool when available, honoring its write confirmation. Studio remains the actual editor and an explicitly chosen administrator fallback for unsupported operations; routine volunteers stay in the library chat. Never invent a tool or use unrestricted mutations. Publishing makes the record publicly readable but does not update the live website.

For a content-only release, the library chat opens and merges a `content/*` PR with its GitHub tools (publishing skill, “Save a content change”); the **Website preview** and **Live website** commit statuses carry the links. For code changes, use the existing Codex environment and the PR workflow in [WORKFLOW.md](WORKFLOW.md): isolated worktree/branch, current-content preview URL, “Ready to save?”, explicit chat approval, conflict handling, checked merge, exact-asset live deployment and verification. CMS-only requests keep their content in Sanity; the PR records the request and changed document IDs/revisions in its own `content-updates/<YYYY-MM-DD>-<short-name>.json` (older saves used `assistant/website-update.json`). Do not duplicate records in source seeds. If a current connection cannot hand the request to Codex, preserve the draft/request and give the existing editor entry point; do not invent a bridge or recreate the website.

The reporting connector is read-only Analytics. No publishing connector reconnect or external approval page is required for routine PR saves. The existing CMS review page remains an explicitly chosen administrator recovery route, with its existing identity and exact-version checks intact.

Check installed connections independently of source instructions. Reconnect Sanity only when its actual authorization fails; do not reinstall an existing plugin or promise permanent sign-in. No private-draft visual website preview is implemented. Full library-device, recovery and account acceptance remain separate from local tests.

## Setup and recovery reference

Studio configuration: `studio/README.md` (public project/dataset identifiers only). Publisher, webhook and review-app credentials: `cms-publisher/README.md`; workflow variables/secrets are named in `.github/workflows/cms.yml` and `check.yml`. The one-time migration commands (`pnpm cms:seed`, `pnpm cms:import --write-drafts`) remain for recovery only: they create drafts, never overwrite or publish, and need a temporary write token kept outside chat and the repository, revoked afterward. Backups and restore: `assistant/MAINTENANCE.md`, "CMS backups".

## Publishing, failures and maintenance

The signed webhook records document/revision identity, deduplicates deliveries and asks GitHub to build the current reviewed source. The build validates the complete published dataset, optimizes images, renders real routes, checks links/layout on computer and phone, and saves an immutable release. The worker binds the review to source, document revision, content fingerprint, asset digest and successful preview run.

`cms.yml` retains the administrator CMS recovery path. Routine PR saves use `publish-live.yml`; both can publish live only to the fixed production branch of the live project. It checks the human approval receipt, current source/content and exact checked artifact; it does not rebuild after approval. It retains the previous verified immutable site and restores/checks it if the new hosted result fails verification. If recovery cannot be verified, say the website needs attention; a saved database pointer is not evidence the old website is still live. See `cms-publisher/README.md` for precise state/credential contracts.

The existing daily source check also runs the CMS fixture suite. Once configured, a trusted-main-only job reads live published content, builds from a frozen snapshot without passing credentials to Astro, checks private publisher status and reconciles missed webhook deliveries. It does not change CMS content. Existing bounded Plus upkeep can fix a small technical rendering/adapter problem or exact existing Studio dependency versions, then must pass the same checks before saving. It cannot change library facts, forms/schema, permissions, publishing/authentication logic, tests or workflows. Those failures require a reviewed change or account owner action. A source repair requires a fresh PR preview and human approval; old approval is never transferred.

The private publisher status records what was attempted and what was actually verified. Volunteers should see one practical message, for example:

- “Your event is saved in the CMS. Please review the website preview.”
- “Your event is on the live website. I checked the date and time.”
- “That update did not pass its checks. The previous checked website was restored.” **Only after actual recovery verification.**
- “The update needs attention. Please reconnect the library account.” Include one real clickable next step.

The Monday assistant review reads current source checks, CMS/publisher status and actual repair/deploy outcomes, then explains new failures or repairs plainly. Immediate GitHub-to-ChatGPT notifications remain unverified; do not promise instant alerts. A healthy report must not hide an expired/missing check, unconnected CMS, pending review, lost credentials, allowance exhaustion or failed rollback.

GitHub artifact storage is bounded. Approval must refer to an available checked artifact; if it expires/is pruned, prepare a new preview. Never rebuild an apparently identical substitute and reuse approval. Hosting/API outages, expired sign-ins, revoked permissions and depleted quotas may need a library administrator. AI repair cannot guarantee unattended recovery from those conditions.

## Checks

Run `bash scripts/cms-check.sh`, `pnpm check`, `pnpm build`, release safeguards, analytics/connector checks and computer/phone capture. The CMS suite uses real Studio validation, a real Astro build and a real local Worker/SQLite runtime. Provider responses and identities in service tests are synthetic; they do not prove live accounts or deployment. Live behavior is established only by the actual workflow results and the live website.
