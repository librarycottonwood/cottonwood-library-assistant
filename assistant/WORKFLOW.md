# Administrator and agent workflow

## Content provider first

Read `assistant/CMS.md` and verify the actual provider before choosing an edit path. The library's Sanity project, native editor, signed webhook and checked publisher are configured, and `LIBRARY_CONTENT_SOURCE=sanity` is enabled. Read the live publishing result before reporting that a particular version is on the website. New CMS work uses drafts in the real Studio. Once the website provider is enabled, events, posts, programs, newsletters, notices, settings/hours and giving records are edited in Sanity; do not duplicate those edits in seed/editorial files. Use the connected CMS tools only when they actually exist, or the included Studio forms. Layout/code changes still use the source workflow below.

CMS publication queues an immutable website preview; it does not itself make the trial website live. The reviewer uses the separate authenticated approval service, and `cms.yml` promotes the exact checked artifact to **cms-trial** only. It verifies the hosted result and attempts verified restoration after a failed upload. This is the single saved trial website. The retired **trial** address redirects there; immutable review copies are temporary versions, not another volunteer destination. The public domain is separate. Nonprofit approval, plugin release and full handoff/recovery rehearsals are separate gates; do not represent local tests as their completion.

## Source edits

1. Read the request, inspect current files/status, and research what is needed. Resolve routine implementation choices independently.
2. Make the smallest useful edit. Verify with `pnpm check` and `pnpm build`.
3. Run `pnpm assistant:prepare`; it saves the built site under an immutable SHA-256 digest in `output/releases/`. Keep the manifest and previous release.
4. Run `pnpm assistant:capture -- <digest>` to render that saved release on desktop and phone. Inspect the real screenshots, browser errors, and internal links. The script records evidence in `output/playwright/<digest>/`.
5. For an online preview, set `CLOUDFLARE_PREVIEW_PROJECT` to a dedicated demo/preview Pages project and run `pnpm assistant:preview -- <digest>`. Its production branch must be `production`; preview uploads always use `draft-<digest>`. This project must never have the library's real domain attached.
6. The preview helper uploads the verified site with a separate `_review/` page containing the checked computer and phone pictures. It returns the immutable website, pictures page, and image URLs, and saves them to the release's `preview.json`. Show the verified website preview link and a friendly "See both pictures" link. Capture stays enabled, but omit inline image embeds while delivery is broken in the library account. Do not claim invisible attachments were shown. Ask for approval of this version. Keep the approved digest with the chat record.
7. Production is intentionally unavailable to these scripts. Before launch, connect a human-controlled publishing service that authenticates the reviewer, binds approval to this digest, verifies the stored asset hashes, publishes those same assets, and retains/verifies rollback. Do not pass production credentials into the agent environment or represent Markdown instructions as an enforced approval gate.

## Pictures

Every new photo, screenshot, poster or logo goes through `pnpm assistant:image -- <file> --name <short-name>` before use. It turns the picture upright, shrinks it to at most 2400px, removes hidden camera and location details, and saves it in `library-files/images/` as JPEG (photos) or PNG (screenshots and graphics). Register it in `src/content/images.ts` and show it with `<Image>` from `astro:assets` (or `ContentImage`), with `width` set to the largest of `widths`, `quality={70}`, real `alt` text, and `loading="eager"` only for the first picture on a page. Never put photos in `public/` or use `<img src={picture.src}>`.

`pnpm build` runs the picture check and fails when a picture is too large, keeps location details, is unused, or skips resizing. Fix the picture rather than loosening the limits in `scripts/images.mjs`.

## Cloud environment

Connect this private repository in ChatGPT Work → Cloud. Use `bash scripts/cloud-setup.sh` as the install script. Use `assistant/START.md` as the start instructions. Publish the prepared environment after setup and checks succeed. Test a new task, rather than relying only on the environment setup conversation.

Library editing entry point: `https://chatgpt.com/codex/cloud`. It opens the Cloud composer. Select the published `cottonwood-library-editor` environment before sending a website request. An ordinary ChatGPT project chat does **not** automatically connect to this environment merely because its instructions mention the name. The installed Cottonwood Library plugin supplies the friendly instructions; a Project is not needed.

The published install/start configuration additionally puts pnpm and caches under `/workspace`, because the default home directories in this cloud runtime were unwritable. Keep that tested wrapper when updating the environment.

Verify a new task and a follow-up in the volunteer's browser before calling the workspace ready. Local layout checks and actual hosted access are separate checks; record their results and account/browser blockers in setup-status.json. Keep the existing environment and credentials until a replacement is verified. Test the weekly review independently; an editor error does not establish a maintenance failure.

Allow package/download hosts during installation. Browser installation may require system dependencies. Do not put secrets in the repository. Add only preview project credentials to the environment's secret store after testing the dedicated preview project. Account linking and publishing the cloud environment require the signed-in account UI.

## Save trial changes

The single saved trial is https://cms-trial.cottonwood-library-trial-preview.pages.dev/ . Content updates use the CMS route above. The former source-demo publishing workflow is retired; do not deploy a local seed build over the CMS trial. Its old address redirects to the matching page on the CMS trial.

1. Verify that approval refers to the last reviewed digest and that its source and assets have not changed. Identify only the request's changed files; exclude output, credentials and unrelated edits.
2. Inspect the current remote `main` and compare each affected file with the task's original version. Preserve concurrent changes; reconcile conflicts and show a new preview before saving.
3. Save approved source changes through authenticated GitHub tools or Git. Prefer an atomic commit with the current remote head as parent. Read the saved commit back; source saved is distinct from website published.
4. Main checks and CMS reconciliation prepare a fresh preview from the actual published Sanity content. A source change requires its own exact checked CMS preview and authenticated approval before publication. Do not reuse a source-only fixture build or an earlier approval.
5. `cms.yml` promotes the approved saved assets to the single CMS trial and verifies them. Confirm the hosted `/_review/status.json` agrees with the verified publishing operation before saying the website is updated. While pending, say that the source is saved and the website preview needs review. Failed updates leave the previous verified CMS trial available, subject to the actual recovery result.
6. For undo, restore only the requested change while preserving later work, then follow the same checks, preview, approval and verified CMS publishing route.

New tasks refresh repository source in the background. Check remote `main` and refresh the checkout before a new edit; a chat's existing draft is not automatically the latest saved website. Do not replace a different unfinished draft silently.
