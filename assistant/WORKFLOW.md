# Administrator and agent workflow

## Content provider first

Read `assistant/CMS.md` and verify the actual provider before choosing an edit path. The library's Sanity project, native editor, signed webhook and checked publisher are configured, and `LIBRARY_CONTENT_SOURCE=sanity` is enabled. Read the live publishing result before reporting that a particular version is on the website. New CMS work starts with drafts through the actual connected Sanity tools or the real Studio. Show the proposed content in the chat; after the volunteer confirms it, use the supported document publishing tool to queue the website preview. Studio is a fallback when a needed operation is unavailable, not a routine handoff. Once the website provider is enabled, events, posts, programs, newsletters, notices, settings/hours and giving records are edited in Sanity; do not duplicate those edits in seed/editorial files. Use the connected CMS tools only when they actually exist, or the included Studio forms. Layout/code changes still use the source workflow below.

CMS publication queues an immutable website preview; it does not itself make the trial website live. The reviewer uses the separate authenticated approval service, and `cms.yml` promotes the exact checked artifact to **cms-trial** only. It verifies the hosted result and attempts verified restoration after a failed upload. This is the single saved trial website. The retired **trial** address redirects there; immutable review copies are temporary versions, not another volunteer destination. The public domain is separate. Nonprofit approval, plugin release and full handoff/recovery rehearsals are separate gates; do not represent local tests as their completion.

## Source edits

In ChatGPT Work, use the connected GitHub tools to prepare an isolated source branch and pull request. The repository's checks build that exact draft with one frozen snapshot of published library content. After the successful check, the trusted `Host checked code preview` workflow uploads only its verified static files and puts the immutable link in the pull request. Read that result for the current source commit before sharing it. A saved branch or a successful local build alone is not a hosted preview. This integration must be enabled on main before it can run; check the dated setup record and actual workflow result.

The preview covers the Astro website. Changes to the editor, approval service, connections or automation also need their affected runtime checks; the website link does not demonstrate those interfaces. The source preview never promotes the saved trial. Source saving and the exact CMS trial approval remain the separate steps below.

When working in a prepared coding environment, the same build/capture helpers can be run directly:

1. Read the request, inspect current files/status, and research what is needed. Resolve routine implementation choices independently.
2. Make the smallest useful edit. Verify with `pnpm check` and `pnpm build`.
3. Run `pnpm assistant:prepare`; it saves the built site under an immutable SHA-256 digest in `output/releases/`. Keep the manifest and previous release.
4. Run `pnpm assistant:capture -- <digest>` to render that saved release on desktop and phone. Inspect the real screenshots, browser errors, and internal links. The script records evidence in `output/playwright/<digest>/`.
5. For an online preview, set `CLOUDFLARE_PREVIEW_PROJECT` to a dedicated demo/preview Pages project and run `pnpm assistant:preview -- <digest>`. Its production branch must be `production`; preview uploads always use `draft-<digest>`. This project must never have the library's real domain attached.
6. The preview helper uploads the verified site with a separate `_review/` page containing the checked computer and phone pictures. It returns the immutable website, pictures page, and image URLs, and saves them to the release's `preview.json`. When the volunteer asks to see the change, give the verified website preview link. Keep the pictures as internal evidence unless they ask for them. If requested, use actual returned attachments when supported or the working pictures-page link; do not claim invisible attachments were shown. Ask for approval when they want to save this version, and keep its digest with the chat record.
7. Production is intentionally unavailable to these scripts. Before launch, connect a human-controlled publishing service that authenticates the reviewer, binds approval to this digest, verifies the stored asset hashes, publishes those same assets, and retains/verifies rollback. Do not pass production credentials into the agent environment or represent Markdown instructions as an enforced approval gate.

## Pictures

Every new photo, screenshot, poster or logo goes through `pnpm assistant:image -- <file> --name <short-name>` before use. It turns the picture upright, shrinks it to at most 2400px, removes hidden camera and location details, and saves it in `library-files/images/` as JPEG (photos) or PNG (screenshots and graphics). Register it in `src/content/images.ts` and show it with `<Image>` from `astro:assets` (or `ContentImage`), with `width` set to the largest of `widths`, `quality={70}`, real `alt` text, and `loading="eager"` only for the first picture on a page. Never put photos in `public/` or use `<img src={picture.src}>`.

`pnpm build` runs the picture check and fails when a picture is too large, keeps location details, is unused, or skips resizing. Fix the picture rather than loosening the limits in `scripts/images.mjs`.

## Working in the library's chat

Use ChatGPT Work for guided content changes through the connected CMS and source drafts through the GitHub workflow above. Codex can use the prepared coding environment when available; it is not required to publish a checked source preview. Verify actual tool and workflow results rather than assuming one conversation can invoke another. Preview the changed source through the repository's workflow.

The ordinary pull-request check builds local sample content. Label that evidence honestly. A sample-content screenshot is not a preview of current published Sanity records and cannot authorize an update to the saved CMS trial. For the website update, use the actual Sanity snapshot, separate authenticated review and exact checked artifact described in [CMS.md](CMS.md). If a working preview cannot be delivered in this chat, identify that unfinished step; do not redirect the volunteer into a known broken workspace or claim publication.

Preview links are the default volunteer output. Native picture attachments have worked in ChatGPT Work in Safari, but show them only on request. Keep screenshot checks separate from delivery: capturing an image does not prove it was shown in the chat.

## Coding environment

Use the prepared library environment for source work when it is available. Read `assistant/setup-status.json` and verify current account behavior before relying on an earlier rehearsal. Keep dated browser failures and access limitations in that setup record rather than encoding a temporary workaround as the volunteer workflow.

For environment setup or repair, connect the private repository, use `bash scripts/cloud-setup.sh` and `assistant/START.md`, preserve the tested writable `/workspace` package/cache wrapper, then publish the prepared environment. Verify a new task, a follow-up, actual hosted access and preview delivery before recommending it. Local layout checks are separate from network and publishing access. Keep existing credentials/environments until a replacement is verified. Do not put production credentials in the agent environment. Test weekly maintenance independently; an editor error does not establish a maintenance failure.

## Save trial changes

The single saved trial is https://cms-trial.cottonwood-library-trial-preview.pages.dev/ . Content updates use the CMS route above. The former source-demo publishing workflow is retired; do not deploy a local seed build over the CMS trial. Its old address redirects to the matching page on the CMS trial.

1. Verify that approval refers to the last reviewed digest and that its source and assets have not changed. Identify only the request's changed files; exclude output, credentials and unrelated edits.
2. Inspect the current remote `main` and compare each affected file with the task's original version. Preserve concurrent changes; reconcile conflicts and show a new preview before saving.
3. Save approved source changes through authenticated GitHub tools or Git. Prefer an atomic commit with the current remote head as parent. Read the saved commit back; source saved is distinct from website published.
4. Main checks and CMS reconciliation prepare a fresh preview from the actual published Sanity content. A source change requires its own exact checked CMS preview and authenticated approval before publication. Do not reuse a source-only fixture build or an earlier approval.
5. `cms.yml` promotes the approved saved assets to the single CMS trial and verifies them. Confirm the hosted `/_review/status.json` agrees with the verified publishing operation before saying the website is updated. While pending, say that the source is saved and the website preview needs review. Failed updates leave the previous verified CMS trial available, subject to the actual recovery result.
6. For undo, restore only the requested change while preserving later work, then follow the same checks, preview, approval and verified CMS publishing route.

New tasks refresh repository source in the background. Check remote `main` and refresh the checkout before a new edit; a chat's existing draft is not automatically the latest saved website. Do not replace a different unfinished draft silently.
