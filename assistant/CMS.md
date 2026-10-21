# Library content management

## Current state and ownership

PR #22 merged the CMS implementation on October 20, 2026. The library signed in through its GitHub identity `librarycottonwood`, which owns organization `oprdu6k2x` and project `2ou0xy2r` (Cottonwood Community Library), dataset `production`. The real native Studio is hosted at https://cottonwood-community-library.sanity.studio/ (app `atvxa15iv13so2hw9kkp8zp2`). The initial import uploaded 16 assets. The nine existing trial content records were published through the native Studio on October 20 to initialize the connected provider. These remain prototype facts for board review before public launch; they are not newly confirmed library events.

**The repository provider is now `sanity`.** The library-owned publisher, identity-only GitHub review app, scoped dispatch/deployment connections and signed published-document webhook are configured. The publisher is https://cottonwood-library-cms-publisher.librarycottonwood.workers.dev/. Read its authenticated status or the actual CMS workflow report before claiming a preview or verified website update; configuration and CMS publication alone are insufficient. The official Sanity plugin was connected in the library ChatGPT account on October 20; actual reads, private event-draft creation, end-time correction and draft discard succeeded in Safari. Complete ChatGPT-to-website publishing/recovery acceptance remains separate. Nonprofit approval and a backup administrator remain handoff gates. The nonprofit application was submitted October 20 from `librarycottonwood@gmail.com`; the official form confirmed receipt. Check the installed library plugin version in `assistant/setup-status.json`; source edits alone do not update the account. Verify dated setup evidence against the actual connection before promising access.

Keep ownership with the library's account and add a second library administrator/recovery path. The library chose GitHub sign-in during setup; a Google sign-in has not been linked or verified. Invite Jaden separately. The website, GitHub, Cloudflare, Google, Givebutter and ChatGPT remain library-owned. Runtime publishing must not require Jaden's laptop or the Pi.

**Additional recurring budget: $0.** Apply for Sanity's [nonprofit plan](https://www.sanity.io/docs/platform-management/non-profit-plan) once there is a project ID. The plan/application is not approved yet. Confirm its current limits and renewal terms with Sanity; do not add a card, enable overages or assume eligibility. Start only within the free allowance while waiting. The existing ChatGPT Plus sign-in handles bounded technical upkeep; no paid OpenAI API is introduced. Do not enable Sanity image generation/transformation tools. GitHub/Cloudflare allowances remain finite and must stop before paid overage.

## Shared content sources

When `LIBRARY_CONTENT_SOURCE=sanity`, the website reads one validated, published-content snapshot for a whole build. Missing configuration, broken references, unavailable content or invalid data stop that build. They never silently substitute the prototype's old content.

| Edit in Studio | Used by the website |
| --- | --- |
| One event with confirmed sessions | Homepage coming up, calendar, event list/detail, referenced news posts |
| One program | Shared recurring program descriptions and pictures; no invented dates |
| One blog post | News feed and article, rich text, cover/gallery, event references |
| Newsletter PDF and cover | Current issue selected in settings; old issues remain in the archive |
| Notice with Pacific first/last dates | Shared notice banner |
| Library settings and hours | Shared contact details, map/address, navigation, page copy; phone link and hours summary derive automatically |
| Giving and acknowledgments | Ways to help, thank-yous and approved Givebutter widget identifiers |

Each confirmed event date requires both a start and an end time, with the end later than the start. Upcoming event rows, featured pictures and calendar highlights recheck the confirmed end time in the visitor's browser, including after a tab resumes. Events stay listed while they are happening and stop being promoted after they end, between builds; their historical detail pages remain available. This does not modify CMS records or replace the approved release.

Payments, donors and live fundraising totals stay in Givebutter. Donor data, passwords, keys, private board records and personal details do not belong in public website documents. Public Sanity datasets expose published documents and original uploaded assets even when a website does not link them. The website emits resized, metadata-free images; check Sanity's treatment of **original uploads** during the live rehearsal before claiming the entire upload pipeline removes private metadata.

The local provider remains available for isolated fixtures and explicit recovery work; ordinary connected publishing uses `LIBRARY_CONTENT_SOURCE=sanity`. Its seed/editorial files are migration inputs. After activation, volunteers edit the CMS; do not also update those files for ordinary publishing. Code/layout work stays in reviewed GitHub changes.

## Volunteer workflow

1. Gather the facts in ChatGPT using the existing short topic wizards, or open the Studio forms directly.
2. When the library's Sanity connection and permitted tools are actually available, ChatGPT reads the existing record and edits a **draft**. Use references for existing events/programs. Ordinary requests never require editing source files or a PR. Never invent a tool name, claim a connection from instructions alone or publish through unrestricted raw mutations.
3. Show the proposed title, description and dates in the conversation and ask whether to prepare the website preview. After the volunteer confirms those details, use Sanity’s supported `publish_documents` tool when it is actually available, with the exact document IDs read back from the draft. Honor its write confirmation. This publishes the records to the CMS and queues the website preview; it does not update the saved website. The published CMS data is publicly readable, so never use this step for private information. Do not send volunteers into Studio for a routine supported operation. If the tool is unavailable, explain the specific limitation and offer the actual editor as a guided fallback.
4. When someone asks to see the change, give the exact website preview URL from the successful publishing report or operation. Screenshots remain internal checks unless requested. When they want to save, give that version's authenticated review link. The library signs in with its GitHub identity and approves that version. Only then can the service promote the same checked assets to the dedicated **CMS trial** website.
5. The service checks the hosted files before saying the website was updated. If the content/source changes after the preview, it needs a fresh preview and approval.

The volunteer confirms the proposed content in chat, then approves the checked website preview. ChatGPT handles the intervening CMS publication with its supported tools; Studio is an optional editor and fallback. No private-draft visual website preview is implemented. A future simplification must preserve actual authenticated approval and exact-version checking; a chat message alone is not an enforced publishing gate.

If the Sanity tools are unavailable in the library's current ChatGPT plan/session, use Studio's included forms. Do not buy another subscription or redirect routine content edits to source-code work. Check the installed Sanity plugin separately from the Cottonwood instruction plugin. Reconnect the existing connection when authorization expires; do not reinstall an already installed plugin or promise permanent sign-in. The [official Sanity MCP guide](https://www.sanity.io/docs/ai/mcp-server) describes that connection; actual Plus-account availability and write confirmations must be tested.

## Meeting setup

1. Organization/project creation is complete under the library's GitHub sign-in. The nonprofit application for project `2ou0xy2r` was submitted from the library Google account; await the decision email. Confirm the second library administrator and recovery. Stop at any paid upgrade/card request.
2. Choose published dataset visibility knowingly. Create a **read-only** server token only if needed. Use separate narrowly scoped credentials for the signed webhook, workflow callbacks, private status checks, GitHub dispatch and reviewer OAuth. The publisher documentation lists these. No write token is needed in the website or publishing worker.
3. Configure `studio/.env.local` using its example and run/host the real Studio. Public Studio variables contain project/dataset identifiers only. Confirm exact CORS origins and appropriate individual roles. Use a separately invited contributor/draft identity for automated editing where the account's plan permits it; retain publish/admin authority with the library. A connection inherits its signed-in identity’s privileges. On October 20 the board authorized the official ChatGPT connection as the library-owned GitHub identity, scoped in Sanity’s consent screen to the library organization. This is not a demonstrated draft-only credential. Keep routine requests to drafts, confirmation in chat and the supported document publishing tools; do not infer permission for schema, account, project or dataset changes. A separately constrained identity remains a handoff improvement. Tool prompts and UI singleton controls are not access control.
4. Export the current prototype for review, using the **actual** project ID and dataset:

   ```sh
   pnpm cms:seed --project ACTUAL_PROJECT_ID --dataset ACTUAL_DATASET --out output/cms/migration.json
   pnpm --dir studio validate:import ../output/cms/migration.json
   ```

   This is a migration preview containing existing prototype copy, including historical events. It is not approved library content. Review dates, hours, links, wording and donation settings with the board. The exporter groups the existing two-day book sale into one event with two sessions.

5. Run the explicitly authorized import with a temporary setup-only write token stored outside chat/repository:

   ```sh
   SANITY_PROJECT_ID=ACTUAL_PROJECT_ID SANITY_DATASET=ACTUAL_DATASET pnpm cms:import --file output/cms/migration.json --write-drafts
   ```

   The command reads `SANITY_WRITE_TOKEN` from the administrator's environment. It uploads the prepared pictures/PDFs, creates **drafts only**, skips existing drafts/published records, and never overwrites or publishes them. Revoke the temporary token afterward. `--keep-legacy-assets` deliberately retains repository asset references instead of uploading; this is a migration option, not the ordinary editor workflow.

6. Review those drafts in the real Studio. Publish the initial complete settings/content only when authorized. Confirm actual references and image/PDF uploads work. A partial dataset fails rather than rendering a mixed website.
7. Configure the separate worker and OAuth review app using `cms-publisher/README.md`. Configure GitHub variables/secrets named by `.github/workflows/cms.yml` and `check.yml`; enable `LIBRARY_CONTENT_SOURCE=sanity` only after the dataset and webhook are ready. Studio build success does not establish this connection.
8. Test the complete path on `cms-trial.cottonwood-library-trial-preview.pages.dev`. This is the single saved trial. The old source-demo publishing path is retired; its address redirects here. The real public domain remains separate, with no domain attachment or registrar change.
9. Connect the official Sanity MCP in the library ChatGPT account, expose only needed tools, and rehearse with an ordinary new chat. Update/release the library plugin source after this branch is accepted, then test the installed version. Editing repository instructions alone does not update the installed plugin or existing scheduled task.

## Publishing, failures and maintenance

The signed webhook records document/revision identity, deduplicates deliveries and asks GitHub to build the current reviewed source. The build validates the complete published dataset, optimizes images, renders real routes, checks links/layout on computer and phone, and saves an immutable release. The worker binds the review to source, document revision, content fingerprint, asset digest and successful preview run.

`cms.yml` can publish only to the fixed CMS trial branch. It checks the human approval receipt, current source/content and exact checked artifact; it does not rebuild after approval. It retains the previous verified immutable site and restores/checks it if the new hosted result fails verification. If recovery cannot be verified, say the website needs attention; a saved database pointer is not evidence the old website is still live. See `cms-publisher/README.md` for precise state/credential contracts.

The existing daily source check also runs the CMS fixture suite. Once configured, a trusted-main-only job reads live published content, builds from a frozen snapshot without passing credentials to Astro, checks private publisher status and reconciles missed webhook deliveries. It does not change CMS content. Existing bounded Plus upkeep can fix a small technical rendering/adapter problem or exact existing Studio dependency versions, then must pass the same checks before saving. It cannot change library facts, forms/schema, permissions, publishing/authentication logic, tests or workflows. Those failures require a reviewed change or account owner action. A source repair changes the approved source version and requires a fresh CMS preview; old approval is never transferred.

The private publisher status records what was attempted and what was actually verified. Volunteers should see one practical message, for example:

- “Your event is saved in the CMS. Please review the website preview.”
- “Your event is on the trial website. I checked the date and time.”
- “That update did not pass its checks. The previous checked website was restored.” **Only after actual recovery verification.**
- “The update needs attention. Please reconnect the library account.” Include one real clickable next step.

The Monday assistant review reads current source checks, CMS/publisher status and actual repair/deploy outcomes, then explains new failures or repairs plainly. Immediate GitHub-to-ChatGPT notifications remain unverified; do not promise instant alerts. A healthy report must not hide an expired/missing check, unconnected CMS, pending review, lost credentials, allowance exhaustion or failed rollback.

GitHub artifact storage is bounded. Approval must refer to an available checked artifact; if it expires/is pruned, prepare a new preview. Never rebuild an apparently identical substitute and reuse approval. Hosting/API outages, expired sign-ins, revoked permissions and depleted quotas may need a library administrator. AI repair cannot guarantee unattended recovery from those conditions.

## Acceptance before handoff

Run `bash scripts/cms-check.sh`, `pnpm check`, `pnpm build`, release safeguards, analytics/connector checks and computer/phone capture. The CMS suite uses real Studio validation, a real Astro build and a real local Worker/SQLite runtime. Provider responses and identities in service tests are explicitly synthetic; they do not prove live accounts or deployment.

Then rehearse in the **library account**, observing the actual final website and private status:

- Create one event; correct its date/time once; check every appearance, including calendar and event references.
- Add a rich-text blog post with a real photo/gallery; verify image privacy, resizing, links and layout on phone/computer.
- Replace the current newsletter PDF, then verify the current issue and the older archive download.
- Publish a closure and correct hours once; confirm shared contact/hours displays agree.
- Unpublish content, including references; verify stale promotions disappear and invalid missing references block release safely.
- Reject a preview; make another edit while one is pending; confirm stale approval cannot deploy.
- Test duplicate/missed webhooks, service outage, tampered artifact, wrong source/digest and unauthorized reviewer.
- Intentionally fail a build and hosted verification; confirm actual previous-site recovery and the library-facing explanation.
- Test an allowed maintenance repair and a forbidden content/auth change; inspect the real cloud checks, saved source and new preview approval.
- Export/restore Sanity content **and assets**, recover accounts using the second library administrator, and complete a publish without Jaden's account/laptop/Pi.

Backups, retention, restore, plan limits, ChatGPT delivery and live recovery are handoff gates until demonstrated. Studio hosting and native Studio-to-trial publication have been verified. This code does not configure a backup schedule or establish nonprofit approval, ChatGPT-to-website acceptance or a complete handoff.
