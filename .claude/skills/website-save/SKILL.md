---
name: website-save
description: Save a change to the library website - publish Sanity content, open the pull request, get the preview, ask "Ready to save?", merge after a yes and confirm it is live. Use whenever a website change is ready to save, when someone asks where their change is, when an update failed, or to undo or discard a change.
---

# Save a change to the website

Every website change goes through the same steps. The person only sees: the preview link, the question "Ready to save?", and the result. Do the rest quietly.

Repo: `librarycottonwood/cottonwood-library-assistant`. Below, `REPO=repos/librarycottonwood/cottonwood-library-assistant`.

## 1. Content in Sanity (skip for code-only changes)

Use the Sanity connector with `projectId: 2ou0xy2r`, `dataset: production`.

1. **Check for other waiting changes first.** Look for open PRs that only add `content-updates/` files (`gh pr list --json number,title,files`), and compare current published records with https://cottonwood-library.pages.dev/_content/revisions.json. If someone else's change is waiting, say: "Someone else's change is also waiting: <what it is, in plain words>. If we save now, it goes on the website too. Include it, or wait?" Wait for the answer.
2. Read the current record(s) (`query_documents` / `get_document`), and `get_schema` if unsure of a field. Field contract: `studio/README.md`. **Keep the current value of every field you will change**; it goes in the save file as `before`, so any later chat can undo this save.
3. Make the change as a **draft** (`create_documents` or `patch_documents`). Keep existing IDs, slugs and `_key`s. Don't touch unrelated fields or other people's drafts.
4. Show the proposed result in plain words (title, dates with weekday, times, summary). Get a yes on the facts.
5. Upload any photos before publishing the records that use them. Publish exactly those drafts with `publish_documents` (use `ifRevisionId` from your read). Publishing makes the record public in the CMS but does **not** change the live website yet.

### Photos

1. Strip hidden location data and resize first: `node scripts/images.mjs prepare <file> --out /tmp/photos --name <short-name>`.
2. Call `dataset_assets_upload_from_file` (`assetType: image`, a real `description`), then POST the file bytes to the returned `uploadUrl` with `curl --data-binary @/tmp/photos/<file> -H 'Content-Type: image/jpeg' "<uploadUrl>"` (use `image/png` when the prepared file ends in `.png`).
3. Use the returned asset ID as `{"_type": "libraryImage", "asset": {"_type": "reference", "_ref": "image-..."}, "alt": "..."}`. Gallery items also need a `_key`. When replacing a picture, set this whole value, not just `asset`: drop the old `alt`, `caption`, `fit` and `legacyKey`, and write new alt text for the new picture.
4. If the upload can't reach the file, say so and offer the editor (Studio) as a fallback. Never pretend a photo was uploaded.

#### Picture shape and dead zones

The website crops pictures to fit, and puts things on top of some of them. Check every picture before using it, and follow these rules when making or generating one (an event graphic, a fundraiser banner):

- **Shape:** landscape, about 3:2, at least 1600px wide. Cards crop to roughly 3:2 on computers, 16:9 when one card fills the row, and wider still on phones. The featured block under the homepage hero is 16:9.
- **Safe middle:** keep faces, titles and anything people must read in the middle: the center 70% of the width and the center 60% of the height. The edges, especially top and bottom, can be cut off.
- **Top-left corner:** event cards put the date or schedule badge there (a white pill, as wide as half the card for "Third Thursday · 1 p.m."), and shade the top third dark so the badge stands out. Keep text and faces out of the top-left (the left half of the top quarter), and don't make the top a plain white or very light band, because the shade turns it muddy grey.
- **Fill to the edges:** no white borders or margins, and the background should run to every edge.
- **Flyers and posters** (portrait, text-heavy) look bad here: they shrink, get white bars on the sides, and the top goes grey behind the badge. Don't use a flyer as the website picture. Use a photo, or make a landscape version that follows the rules above, and put the flyer's details (date, time, price) in the summary. The original flyer is still fine for social posts.
- Never set `fit`. The website picks it from the picture's shape: landscape fills the frame, portrait or square shows whole.
- If a picture breaks these rules, say what will happen in one plain sentence ("the title would be hidden behind the date"), and offer to crop it or make a version that fits.

## 2. Branch and pull request

```sh
git fetch origin main
git switch -c content/<short-request-name> origin/main   # code/design changes: claude/<name>
```

- **Content-only:** add a **new** file `content-updates/<today YYYY-MM-DD>-<short-request-name>.json` (lowercase letters, numbers and dashes). Every save gets its own file, so two saves never clash. Never edit `assistant/website-update.json` (older saves only).
  ```json
  {"request": "One sentence in plain words.",
   "sanityDocuments": [{"id": "<published id>", "revision": "<_rev after publishing>", "fields": ["title", "sessions"],
                        "before": {"title": "<old title>", "sessions": ["<old sessions>"]}}],
   "requestedInChat": "YYYY-MM-DD"}
  ```
  Use `"before": null` for a brand-new record. The content itself stays in Sanity.
- **Code/design:** make the change, then run `pnpm check`, `pnpm build` and affected tests. Fix failures before opening the PR.

Commit (`content: ...` or `feat:`/`fix: ...`), `git push -u origin HEAD`, then open the PR:

```sh
gh api $REPO/pulls -f title="<plain request>" -f head=claude/<name> -f base=main -f body="<one-paragraph summary>"
```

## 3. Preview

Tell the person once: "The preview takes about 8 minutes."

1. Get the PR head SHA: `gh api $REPO/pulls/<n> --jq .head.sha`.
2. Every ~60 seconds (usually 5-8 minutes; give up after 20 and say a board admin needs to look, with the run link), check `gh api $REPO/commits/<sha>/status --jq '.statuses[] | select(.context=="Website preview") | .target_url'`.
3. If a check fails instead (`gh api $REPO/commits/<sha>/check-runs --jq '.check_runs[] | {name, conclusion, html_url}'`), read the job log (`gh api $REPO/actions/jobs/<job_id>/logs`), fix what you can and push again. Tell the person plainly if something needs them.
4. Read the PR comment **"What this save puts on the live website"** (`gh api $REPO/issues/<n>/comments`). If it lists **other changes that will also go live**, name each one to the person and ask "Include it, or wait?" before going on. If it says content changed while preparing, push a new commit for a fresh preview.
5. Open the preview (`curl -s <url>/<page>/`) and confirm the change is really there.
6. Send the link and ask: **"Ready to save?"** Then stop and wait.

## 4. Save (only after a clear yes)

A clear yes is "yes", "save it", "looks good", "go ahead" from the person in this conversation. Silence, "probably", or approval for something else is not a yes. A scheduled task never merges.

1. Re-check right before merging: the PR is still open and mergeable (`gh api $REPO/pulls/<n> --jq '{state, mergeable, head: .head.sha}'`), nothing merged to `main` since the preview, the **Website preview** status is under 1 hour old, and no Sanity record was published after the PR's head commit. If any fails, update the branch (`git fetch origin main && git merge origin/main`, or bump `requestedInChat`), push, wait for a fresh preview and ask again if what they'd see changed.
2. Merge: `gh api -X PUT $REPO/pulls/<n>/merge -f merge_method=merge`. A permission prompt appears; that is expected. The person (or Jaden) approves it.
3. Get the merge commit (`gh api $REPO/pulls/<n> --jq .merge_commit_sha`) and wait for its **Live website** status the same way as the preview (about 10 minutes; "Not live yet: waiting to publish" means queued).
4. Open https://cottonwood-library.pages.dev/ and the changed page. Only then say it's saved.
5. Delete the branch if it's still there: `gh api -X DELETE $REPO/git/refs/heads/claude/<name>` (fine if it fails; GitHub may auto-delete it).

### If it doesn't go live

A merged PR can't be retried. Read the PR comment "This save did not reach the live website" and the **Live website** description. Open the live site first: if a later save already put the change live, it's saved.

- "Website content changed after the preview", "another save reached main first", or still not live 15 minutes after the merge with no publish run going: make a **refresh save**. Branch `content/refresh-<short-name>` from current `main`, add `content-updates/<today>-refresh-<short-name>.json` with `request` "Refresh: <original request>" and the same `sanityDocuments` (keep their `before` values), then steps 3-4 again.
- `Sanity content:` in the message: fix that record in Sanity, publish it, then make a refresh save.
- Anything else, or the refresh stops the same way: "Your change is merged but isn't on the website yet. The website still shows the previous version and works. A board admin needs to look at this: <run link>."

Save PRs with no activity for 14 days are closed automatically with a comment. Nothing from them went live, but what they published in Sanity goes live with the next save.

## Where is my change?

Check, in order: the Sanity draft/published record, the PR and its **Website preview** status, the merge, the **Live website** status, the live page. Tell the person the next unfinished step in one sentence. A Sanity draft is not on the website. A failed preview does not mean the live site is down; check the live site before saying anything about it.

## Undo or discard

- **Discard the draft**: `discard_drafts` for only this request's drafts. Read back the result.
- **Cancelled after the Sanity record was published**: put back the values you read before editing and publish them (or unpublish a record you created), then close the PR. Published content goes live with the next person's save, so never leave a published change without an open PR.
- **Undo a saved change**: find that save's PR and its `content-updates/…json` file, put the `before` values back in Sanity (for `"before": null`, unpublish the new record after checking nothing points to it), publish, then do a normal save with request "Undo: <original request>". Tell the person "Putting it back takes about 20 minutes." For code, use a revert commit. Don't delete shared photos.
- **A failed live publish**: the workflow restores the previous site automatically. Check the live page before telling anyone it's fine. If unsure, say the website needs Jaden or a board admin, and open a GitHub issue with the run link.

## Never

Push to `main`, force-push, deploy with wrangler or the Cloudflare API, run `cms.yml` by hand, or reuse an old approval for a different preview. The safety hook blocks most of these; don't look for workarounds.
