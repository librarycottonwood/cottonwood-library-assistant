# Administrator and agent workflow

## Content provider first

Read `assistant/CMS.md` and verify the actual provider before choosing an edit path. The library's Sanity project, native editor, signed webhook and checked publisher are configured, and `LIBRARY_CONTENT_SOURCE=sanity` is enabled. Read the live publishing result before reporting that a particular version is on the website. New CMS work uses drafts in the real Studio. Once the website provider is enabled, events, posts, programs, newsletters, notices, settings/hours and giving records are edited in Sanity; do not duplicate those edits in seed/editorial files. Use the connected CMS tools only when they actually exist, or the included Studio forms. Layout/code changes still use the source workflow below.

CMS publication queues an immutable website preview; it does not itself make the trial website live. The reviewer uses the separate authenticated approval service, and `cms.yml` promotes the exact checked artifact to **cms-trial** only. It verifies the hosted result and attempts verified restoration after a failed upload. The public domain and existing **trial** address are separate. Nonprofit approval, plugin release and full handoff/recovery rehearsals are separate gates; do not represent local tests as their completion.

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

Allow package/download hosts during installation. Browser installation may require system dependencies. Do not put secrets in the repository. Add only preview project credentials to the environment's secret store after testing the dedicated preview project. Account linking and publishing the cloud environment require the signed-in account UI.

## Save trial changes

An approved trial save updates the website source in `librarycottonwood/cottonwood-library-assistant`, on `main`. This is authorized by the volunteer's approval; it does not publish to the real library domain. The stable saved trial is https://trial.cottonwood-library-trial-preview.pages.dev/ . Successful main checks automatically publish the exact checked artifact there; separate draft links remain immutable.

1. Verify that approval refers to the last reviewed digest and that its source and assets have not changed. Identify only the request's changed files; exclude output, credentials and unrelated edits.
2. Inspect the current remote `main` and compare each affected file with the task's original version. Preserve concurrent changes; if they conflict, reconcile and show a new preview before saving. Never overwrite the remote branch with the cloud task's older checkout.
3. Use the authenticated GitHub connector's actual write tools, or authenticated Git when available, to persist the approved source and assets. Discover the available schemas; do not invent tool names or assume missing shell credentials mean GitHub writes are unavailable. Prefer an atomic commit with the current remote head as parent.
4. Read the resulting remote commit and changed file contents to verify the save. Record the reviewed digest, source commit and preview link in the commit description. Say saved only after verification.
5. The cloud check workflow verifies the saved source; Update saved trial website then retrieves that exact checked release and updates the stable trial address. Before saying the website is updated, confirm /_review/status.json identifies the saved source commit and use the actual successful hosting run. While processing, say “Saved! Your trial website is updating. 😊” rather than claiming a completed upload. A failed upload leaves the previous saved trial available and needs investigation.
6. For undo, restore only that approved change from its parent, preserving later work, then check and preview it. Approval of the undo permits saving it by the same mechanism.

New tasks refresh repository source in the background. Check remote `main` and refresh the checkout before a new edit; a chat's existing draft is not automatically the latest saved website. Do not replace a different unfinished draft silently.
