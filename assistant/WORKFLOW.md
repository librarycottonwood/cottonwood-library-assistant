# Administrator and agent workflow

## One request, one PR, one save decision

Use `librarycottonwood/cottonwood-library-assistant` and the prepared library Codex environment. Fetch current main and create a new isolated worktree and branch for each website request. Preserve other worktrees and open PRs. The separate `oobagi/cottonwood-community-library` redesign checkout is not this implementation repository.

1. Read the request, `AGENTS.md`, `assistant/CMS.md` and current setup evidence. Inspect the existing website and content before editing. Resolve routine implementation choices yourself.
2. Make the requested change on the request's branch. Current library content lives in Sanity. Use permitted Sanity tools for drafts, corrections and supported publication; do not copy content into old seed files. For a CMS-only release, update `assistant/website-update.json` with a short request summary and the current content/revision digests, so that the website release still has its own reviewable PR without duplicating CMS records.
3. Run `pnpm check`, `pnpm build`, relevant tests and `pnpm assistant:capture`. Open a PR. Its `pr-preview` job captures actual published Sanity content, builds the exact PR head and checks phone/desktop pages without account credentials. The ordinary `verify` job also checks fixtures; fixture pictures are not current-content previews.
4. `source-trial.yml`, running trusted main code, validates that successful PR artifact and uploads an immutable preview to the existing trial-preview project. Read its `library-source-trial-result` artifact or workflow summary. Verify the returned URL works and inspect the affected page, navigation/forms and internal screenshots. Do not send screenshots unless asked.
5. Give the working website preview URL in chat and ask **“Ready to save?”** Keep the PR, head commit, preview run and release digest in task context. A request merely to look at the website does not ask to save it.
6. After explicit chat approval, fetch main, preserve concurrent changes and resolve ordinary conflicts yourself. Rerun affected checks. The reviewed branch must contain the current main tree plus this request. If conflict resolution or new content materially changes the preview, show the updated URL and ask again. An unchanged checked version does not need repetitive approval.
7. Merge the PR through authenticated GitHub after its checks pass. This is the save decision; no publishing OAuth tool or external approval page is required. The successful main check triggers `source-trial.yml`, which verifies the merged tree equals the reviewed PR tree, verifies current Sanity content/revisions still match, and promotes the exact checked PR assets to **cms-trial**. It never rebuilds after approval. A mismatch stops the save and requires a fresh preview.
8. Check the merged commit, workflow result and live `/_review/status.json`. The status retains the preview's `sourceSha` and adds `mergedSourceSha`; both commits must have the same tree. Match the content/release digests and confirm the existing CMS ledger recorded the verified deployment. A source merge alone is not a completed website save.
9. After verification, remove only this task's completed worktree and branches. Archive managed worktrees using the app's archive tool; remove repository-explicit worktrees through Git. Preserve unrelated/open work, current previews and the previous verified recovery release. Declining leaves the saved trial unchanged.

The single saved trial is https://cms-trial.cottonwood-library-trial-preview.pages.dev/ . The public library domain is separate and unchanged by this workflow. Domain launch, billing, ownership, bulk email and social publishing require their own request.

## Preview and deployment boundaries

Sanity project `2ou0xy2r`, dataset `production`, currently exposes the published content used by the website. PR builds read that public snapshot directly without CMS write/read secrets. If public reads stop working, report that exact blocker; never pass account credentials to untrusted PR code or silently use fixture content.

Only the trusted main workflow receives hosting credentials. It downloads PR artifacts into a separate temporary directory, validates source/run/content/release pins, rejects symlinks and hosting configuration/Worker files, and treats all artifact files as data. It never executes PR build scripts with deployment authority. The existing hosting project must have production branch `production` and no custom library domains. CMS and PR promotions share one serialization lock and verified rollback. Automatic repair may not edit either path's authorization, workflows or tests.

For local preparation, use Node 24 and pnpm 11.15.1. Capture actual published content with `pnpm cms:snapshot --out output/cms/snapshot.json`; set `LIBRARY_CONTENT_SOURCE=sanity`, `SANITY_PROJECT_ID=2ou0xy2r`, `SANITY_DATASET=production`, and `SANITY_SNAPSHOT_PATH` to that file before building. `pnpm assistant:prepare` freezes the built assets; `pnpm assistant:capture -- <digest>` checks that saved release. The existing `pnpm assistant:preview -- <digest>` helper remains available in the prepared cloud editor with its dedicated preview account. Keep its manifest and use the exact PR artifact for the eventual save.

The first restoration PR cannot run a new trusted-main workflow before it is merged. Review its exact CI artifact through the existing preview helper. After approval, its main workflow can upload and promote those same checked PR assets without rebuilding. Verify that first hosted save and ledger adoption before rolling out new account instructions.

## Content and recovery

Chat handles questions/reports; Work with the existing Sanity connection handles supported content drafting/corrections. Codex handles website source, PR previews and saves. Do not recreate the site in Sites, build a new portal or assume Work can silently attach the prepared Codex environment. If a handoff is needed, preserve the request and give the actual existing editor entry point.

Publishing a Sanity record makes it publicly readable and queues the existing CMS check; it does not itself save the trial. Routine requested website saves use the PR workflow above. The existing identity-authenticated CMS review page and `cms.yml` remain recovery tools for an explicitly chosen administrator recovery, not an extra volunteer approval step. The reporting connector has no website publishing tools or scopes. Never ask volunteers to reconnect it for website editing.

Undo only the requested change: restore its source/content, prepare a new PR preview, obtain approval and verify the saved trial. Preserve current unrelated content. A failed upload is resolved only after the previous release is actually restored and verified; a retained pointer alone is insufficient.

## Pictures

Prepare every new photo, screenshot, poster or logo with `pnpm assistant:image -- <file> --name <short-name>`. It turns it upright, limits dimensions, removes hidden camera/location metadata and saves it in `library-files/images/`. Register it in `src/content/images.ts` and use Astro `<Image>` or `ContentImage` with real alt text and appropriate responsive sizes. Do not put photos in `public/` or bypass `scripts/images.mjs`. The build blocks unoptimized or unused pictures. Original Sanity upload privacy still needs its separate rehearsal.

## Existing coding environment

Keep the prepared `cottonwood-library-editor` and tested writable `/workspace` package/cache wrapper. Setup uses `bash scripts/cloud-setup.sh` and `assistant/START.md`. Do not replace the environment because of an old browser failure. Check dated evidence in `setup-status.json`: Safari follow-up submission failed with `DisposableStack`; environment Edit failure is separate; the actual library computer/browser is unverified. Repository edits cannot repair OpenAI's hosted client. Verify a fresh request, follow-up and hosted preview on the actual device before claiming handoff readiness.
