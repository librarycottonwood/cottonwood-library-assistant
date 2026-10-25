---
name: website-save
description: Save a change to the library website - publish Sanity content, open the pull request, get the preview, ask "Ready to save?", merge after a yes and confirm it is live. Use whenever a website change is ready to save, when someone asks where their change is, when an update failed, or to undo or discard a change.
---

# Save a change to the website

Every website change goes through the same steps. The person only sees: the preview link, the question "Ready to save?", and the result. Do the rest quietly.

Repo: `librarycottonwood/cottonwood-library-assistant`. Below, `REPO=repos/librarycottonwood/cottonwood-library-assistant`.

## 1. Content in Sanity (skip for code-only changes)

Use the Sanity connector with `projectId: 2ou0xy2r`, `dataset: production`.

1. Read the current record(s) first (`query_documents` / `get_document`), and `get_schema` if unsure of a field. Field contract: `studio/README.md`.
2. Make the change as a **draft** (`create_documents` or `patch_documents`). Keep existing IDs, slugs and `_key`s. Don't touch unrelated fields or other people's drafts.
3. Show the proposed result in plain words (title, dates with weekday, times, summary). Get a yes on the facts.
4. Publish exactly those drafts with `publish_documents` (use `ifRevisionId` from your read). Publishing makes the record public in the CMS but does **not** change the live website yet.

### Photos

1. Strip hidden location data and resize first: `node scripts/images.mjs prepare <file> --out /tmp/photos --name <short-name>`.
2. Call `dataset_assets_upload_from_file` (`assetType: image`, a real `description`), then POST the file bytes to the returned `uploadUrl` with `curl --data-binary @/tmp/photos/<file> -H 'Content-Type: image/jpeg' "<uploadUrl>"`.
3. Use the returned asset ID as `{"_type": "image", "asset": {"_type": "reference", "_ref": "image-..."}, "alt": "..."}`. Every photo needs real alt text.
4. If the upload can't reach the file, say so and offer the editor (Studio) as a fallback. Never pretend a photo was uploaded.

## 2. Branch and pull request

```sh
git fetch origin main
git switch -c claude/<short-request-name> origin/main
```

- **Content-only:** update `content-updates/latest.json`: `request` (one plain sentence), `sanityDocuments` (`id`, `action`: create/update/unpublish, `fields`), `requestedInChat` (today, YYYY-MM-DD). This file exists so the website gets a reviewable PR; the content itself stays in Sanity.
- **Code/design:** make the change, then run `pnpm check`, `pnpm build` and affected tests. Fix failures before opening the PR.

Commit (`content: ...` or `feat:`/`fix: ...`), `git push -u origin HEAD`, then open the PR:

```sh
gh api $REPO/pulls -f title="<plain request>" -f head=claude/<name> -f base=main -f body="<one-paragraph summary>"
```

## 3. Preview

1. Get the PR head SHA: `gh api $REPO/pulls/<n> --jq .head.sha`.
2. Every ~60 seconds (usually 5-8 minutes), check `gh api $REPO/commits/<sha>/status --jq '.statuses[] | select(.context=="Website preview") | .target_url'`.
3. If a check fails instead (`gh api $REPO/commits/<sha>/check-runs --jq '.check_runs[] | {name, conclusion, html_url}'`), read the job log (`gh api $REPO/actions/jobs/<job_id>/logs`), fix what you can and push again. Tell the person plainly if something needs them.
4. Open the preview (`curl -s <url>/<page>/`) and confirm the change is really there.
5. Send the link and ask: **"Ready to save?"** Then stop and wait.

## 4. Save (only after a clear yes)

A clear yes is "yes", "save it", "looks good", "go ahead" from the person in this conversation. Silence, "probably", or approval for something else is not a yes. A scheduled task never merges.

1. Check the PR is still open and mergeable: `gh api $REPO/pulls/<n> --jq '{state, mergeable, head: .head.sha}'`. If `main` moved or the head changed, update the branch (`git fetch origin main && git merge origin/main`, push), wait for a fresh preview and ask again if what they'd see changed.
2. Merge: `gh api -X PUT $REPO/pulls/<n>/merge -f merge_method=merge`. A permission prompt appears; that is expected. The person (or Jaden) approves it.
3. Get the merge commit (`gh api $REPO/pulls/<n> --jq .merge_commit_sha`) and wait for its **Live website** status the same way as the preview (a few minutes).
4. Open https://cottonwood-library.pages.dev/ and the changed page. Only then say it's saved.
5. Delete the branch if it's still there: `gh api -X DELETE $REPO/git/refs/heads/claude/<name>` (fine if it fails; GitHub may auto-delete it).

If the save stops with **"Published content changed after preview"**, someone published other content meanwhile. Bump `requestedInChat` (or make an empty commit), push, get a fresh preview, ask again.

## Where is my change?

Check, in order: the Sanity draft/published record, the PR and its **Website preview** status, the merge, the **Live website** status, the live page. Tell the person the next unfinished step in one sentence. A Sanity draft is not on the website. A failed preview does not mean the live site is down; check the live site before saying anything about it.

## Undo or discard

- **Discard the draft**: `discard_drafts` for only this request's drafts. Read back the result.
- **Undo a saved change**: restore only that change (previous Sanity values or a revert commit), then do the full preview → "Ready to save?" → merge flow again. Don't delete shared photos.
- **A failed live publish**: the workflow restores the previous site automatically. Check the live page before telling anyone it's fine. If unsure, say the website needs Jaden or a board admin, and open a GitHub issue with the run link.

## Never

Push to `main`, force-push, deploy with wrangler or the Cloudflare API, run `cms.yml` by hand, or reuse an old approval for a different preview. The safety hook blocks most of these; don't look for workarounds.
