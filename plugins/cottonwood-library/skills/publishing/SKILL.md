---
name: publishing
description: Use when a volunteer approves or asks to save a content change, asks how to use Sanity, whether a content change reached the website, or needs help with a failed update, reconnecting the editor, discarding a draft, or undoing a website change.
---

# Library publishing help

Follow library-assistant for conversation. Read `assistant/CMS.md` for the current editor and connections, `assistant/WORKFLOW.md` for website previews and saving, and `assistant/MAINTENANCE.md` when a check or update failed. Read those files from current main, not a past chat.

## Help with the editor

Find out what they are trying to change, then use the relevant topic wizard. Read the current record and schema through the available Sanity tools. Having the Cottonwood instructions installed does not connect Sanity; verify that connection separately.

If Sanity is disconnected, use its actual reconnect screen. Give one step with its link, then wait. Never ask for credentials. After reconnecting, repeat the original read or edit. Do not ask them to install an already installed plugin, buy a service, or move routine content into GitHub.

If the connected tools cannot do the edit, offer the actual editor as a fallback and guide them through it using the field labels in `assistant/content/`. Ask only the next missing question. Routine editing does not need project, dataset or account changes. A broader administrator identity is not permission to change those settings.

## Where is my change?

Read the actual CMS record, PR, its **Website preview**/**Live website** statuses and the live website. Explain the next unfinished step in one sentence.

- A private CMS draft is not published. Show its proposed content here and confirm facts before using the supported document publishing tool. Honor its write confirmation. The current website preview reads published records, not private drafts.
- For code/design changes, follow the Codex PR workflow in `assistant/WORKFLOW.md`.

## Change page text

Events, news, newsletters, notices, fundraisers and the library settings (hours, contact details, the borrowing questions and answers, and the Support Us wording) live in Sanity; change those there. Other words on the website (service descriptions, printing prices, late fees, About Us and so on) are in the page files in `src/pages/`. Search Sanity first, then `src/pages/`. To change them:

1. Find the text in `src/pages/` on current `main`. Create a branch `page/<short-request-name>`, change only the words asked for, and keep the page's components and layout as they are.
2. Open a PR into `main` titled with the request in plain words, then follow steps 3–9 of "Save it" below (preview, "Ready to save?", merge, live check). No content-update file is needed.
3. If the request needs a new section or a layout change rather than new words, it's a design change: follow the code/design workflow in `AGENTS.md` and `assistant/WORKFLOW.md`, and build it only from the existing components in `/components` and the rules in `docs/design-system.md`.

## Save a content change

Do every step yourself with the Sanity and GitHub tools in this chat, on `librarycottonwood/cottonwood-library-assistant`. Tell the volunteer only the preview link, the questions and the result.

### Before you start

1. **Check for other waiting changes.** Look for open PRs whose branch starts with `content/`, and for Sanity documents published since the last live save: compare current published records with https://www.cottonwoodcommunitylibrary.com/_content/revisions.json (if that file is missing, look for records updated after the newest **Live website** success on `main`). If someone else's change is waiting, say: "Someone else's change is also waiting: <what it is, in plain words>. If we save now, it goes on the website too. Include it, or wait?" Wait for the answer.
2. **Upload every photo first**, then publish the records that use them. A record that points to a photo that isn't uploaded yet breaks the preview.
3. **Write down the old values.** Before changing a record, read it and keep the current value of each field you will change. They go in the content-update file as `before`, so any later chat can undo this save.
4. Check every value against "Values that break the website" below, then publish the Sanity records.
5. **Leave no drafts behind.** After publishing, look for a leftover draft of each record you touched (`drafts.<id>`). If one is left and it is yours from this request, discard it; leave other people's drafts alone. A forgotten draft can sneak into someone else's later save.

If a Sanity or GitHub step fails the first time (for example "the editor blocked the change"), try it once more quietly before telling the volunteer. If it fails again, explain it in plain words.

### Save it

1. Create a branch from current `main` named `content/<short-request-name>`.
2. On that branch, add a **new** file `content-updates/<today as YYYY-MM-DD>-<short-request-name>.json` (lowercase letters, numbers and dashes only). Every save gets its own file, so two saves never clash. Do not edit `assistant/website-update.json` (older saves only). Contents:
   ```json
   {
     "request": "One sentence in plain words.",
     "sanityDocuments": [
       {"id": "<published document id>", "revision": "<its _rev after publishing>", "fields": ["title", "sessions"],
        "before": {"title": "<old title>", "sessions": [<old sessions>]}}
     ],
     "requestedInChat": "YYYY-MM-DD"
   }
   ```
   For a brand-new record use `"before": null`. Commit it with a short message.
3. Open a PR into `main` titled with the request in plain words. Tell the volunteer once: "The preview takes about 5 minutes."
4. Wait for the commit status **Website preview** on the PR's head commit to be **success** or **failure**. Check every minute or so. If it fails, or nothing has arrived after 12 minutes, see "If the preview doesn't come". Don't tell the volunteer it's ready until it is **success**.
5. Read the PR comment **"What this save puts on the live website"**. It lists every website document that differs from the live website and marks the ones this save did not list.
   - If it lists **other changes that will also go live**, tell the volunteer before asking: "Someone else's change is also waiting: … If we save now, it goes on the website too. Include it, or wait?" Name each one (for example "the Main Street Readers photo"). If they want to wait, do not merge. Those changes belong to another save or person: look for an open `content/*` PR that lists them and ask whether to finish or undo that one first. Undo someone else's change in Sanity only when the volunteer clearly asks; then push a new commit for a fresh preview and read the list again.
   - If it says content changed while preparing, or it could not compare with the live website, get a fresh preview (push a new commit) before asking.
6. Share the link from **Pages checked on the preview** in that comment (for a settings or notice change, the **Preview** link) and ask **"Ready to save?"** Those pages were opened and showed the right title. Never build a page address yourself, and never share a link the comment doesn't give. If you show a picture in this reply, show only the one you uploaded for this change. Never show pictures from a web search here; volunteers will think that picture is going on the website.
7. After a clear yes, re-check right before merging:
   - the PR is still open;
   - nothing was merged to `main` since the preview;
   - the **Website preview** status is less than 1 hour old;
   - no Sanity record was published after the PR's head commit.

   If any of these fails, push a new commit (for example update `requestedInChat`) for a fresh preview and list, and ask again. Otherwise merge the PR (merge commit).
8. Wait for the commit status **Live website** on the merge commit to be **success** (usually about 6 minutes; "Not live yet: waiting to publish" means it is queued). Then open https://www.cottonwoodcommunitylibrary.com/ and confirm the change. Only then say it is saved. If it fails, or isn't success 15 minutes after the merge, see "If it doesn't go live".
9. Delete the request's branch.

### If the preview doesn't come

Read the **Website preview** description and the failed job's log.

- "No working preview: the … page …": the record's page didn't open on the preview. Check its page address (slug) and that it is published, fix it in Sanity, then push a new commit for a fresh preview.
- A line starting with `Sanity content:` names a record value the website can't use (see the list below). Fix that record in Sanity, publish it, then push a new commit for a fresh preview.
- "Superseded" or no status because a newer commit was pushed: wait for the newer commit's preview.
- Anything else, or still nothing after 20 minutes: you are the fixer. Read the failed job log and fix what you can (a bad record value, a stale branch: update it from `main` and push). If the cause is in the website code, tell the volunteer "The preview didn't finish, so nothing changed on the website, and the current website still works. The library's automatic repair is checking it; ask me again in about an hour." Do not keep retrying the same thing, and never send this to a person.

### If it doesn't go live

A merged PR can't be retried. Read the PR comment "This save did not reach the live website" and the **Live website** description. First open the live website: if a later save already put the change live, it is saved.

- "Website content changed after the preview", "another save reached main first", or still pending after 15 minutes with no publish run still going: make a **refresh save**. Create `content/refresh-<short-name>` from current `main`, add `content-updates/<today>-refresh-<short-name>.json` with `request` "Refresh: <original request>" and the same `sanityDocuments` (keep their `before` values), open a PR and follow steps 3–9 (including the list of other changes).
- `Sanity content:` in the message: fix that record in Sanity, publish it, then make a refresh save.
- Anything else, or the refresh save stops the same way: read the failed job log and fix what you can. Otherwise tell the volunteer "Your change is saved but isn't on the website yet. The website still shows the previous version and works. The library's automatic repair is checking it; ask me again in about an hour." Never send this to a person.

If the volunteer decides not to save, close the PR and delete its branch yourself. If your tools can't close it, leave it: tell the volunteer “Nothing went on the website. It closes by itself in 14 days.” Never ask a volunteer or board member to close PRs, delete branches or remove previews.

Save PRs with no activity for 14 days are closed automatically with a comment. Nothing from them went live, but what they published in Sanity stays published and goes live with the next save, so check that comment's list.

## Values that break the website (check before every publish)

- **Links:** no spaces. Start with `https://`, or use `mailto:name@example.org`, or `tel:` followed by digits only (for example `tel:5303470000`). Pages on our own site start with `/`.
- **Ids and page addresses (slugs):** lowercase letters and numbers separated by single hyphens, like `book-sale-2026`.
- **Event times:** full date and time with seconds and the Pacific offset for the **event's** date, like `2026-11-14T10:00:00-08:00` (offsets are in `assistant/content/events.md`). The end must be after the start. Every event needs at least one date.
- **Plain dates** (notices and their closed days, end dates): `YYYY-MM-DD`. A notice's `staysOpen` is `true` or `false`, never text.
- **Text:** one level of bullets only; no bullets inside bullets.
- **Photos:** JPG, PNG or WebP, uploaded to Sanity, with a short description (alt text).
- **Newsletter Word version:** a `.docx` file asset, made with the newsletter skill's "Accessible Word version" steps: Heading 1 title, no skipped heading levels, every picture described or marked decorative, no "Manual Review" section.
- **Don't unpublish** a record that another record points to (an event used by a news post, a program used by an event, the current newsletter). Change or remove the pointer first.

The reporting connector has no website-saving tools. Do not ask for website OAuth permissions, repeatedly reconnect it, or send volunteers to an external approval page for ordinary saves. The existing CMS review page remains an administrator recovery option when explicitly chosen. Do not present sample-content pictures as current content or imply a repository change repairs an external Codex browser error.

## Fix, discard or undo

For a failure, first establish whether the existing website is working and what the repair system has already attempted. Handle what the available tools and authorization allow. If a person must reconnect an account or make a choice, explain that one action with its real link. A failed preview does not mean the current website is down.

“Discard the draft” means remove only the unfinished work from this request; preserve the published record and other people's changes. Read the result back.

“Undo the website change” means restore only that change. Find that save's PR and its `content-updates/…json` file, read the `before` values, put them back in Sanity (for `"before": null`, unpublish the new record after checking nothing points to it), publish, check that no draft of those records is left (discard any that is), then do a normal save with request "Undo: <original request>". Tell the volunteer: "Putting it back takes about 15 minutes." Do not delete shared assets or promise it is undone before **Live website** is success and you've checked the site.

If the change exposed private information, also delete the uploaded photo or file from Sanity yourself once nothing points to it. Old preview links are removed automatically after the save closes. Undoing the website change alone does not remove uploads. Never ask a volunteer or board member to delete them.
