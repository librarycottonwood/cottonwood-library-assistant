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

## Save a content change

Use this after the Sanity record is published. Do every step yourself with the GitHub tools in this chat, on `librarycottonwood/cottonwood-library-assistant`. Tell the volunteer only the preview link, the question and the result.

1. Create a branch from current `main` named `content/<short-request-name>`.
2. On that branch, update `assistant/website-update.json` with `request` (one sentence), the changed Sanity document IDs/fields, and `requestedInChat` (today's date). Commit it with a short message.
3. Open a PR into `main` titled with the request in plain words.
4. Wait for the commit status **Website preview** on the PR's head commit (usually 5–8 minutes). Check every minute or so. Its target URL is the checked preview. If a check fails, read the job log, fix what you can and say what is wrong.
5. Open the preview and confirm the change is there. Share the link and ask **"Ready to save?"**
6. After a clear yes, merge the PR (merge commit). If `main` moved or a check fails, update the branch and wait for a fresh preview first.
7. Wait for the commit status **Live website** on the merge commit, then open https://cottonwood-library.pages.dev/ and confirm the change. Only then say it is saved.
8. Delete the request's branch.

If Sanity content changes after the preview (someone else published), the save stops with "Published content changed after preview". Update `requestedInChat` in `assistant/website-update.json` on the branch to get a fresh preview, then ask again.

The reporting connector has no website-saving tools. Do not ask for website OAuth permissions, repeatedly reconnect it, or send volunteers to an external approval page for ordinary saves. The existing CMS review page remains an administrator recovery option when explicitly chosen. Do not present sample-content pictures as current content or imply a repository change repairs an external Codex browser error.

## Fix, discard or undo

For a failure, first establish whether the existing website is working and what the repair system has already attempted. Handle what the available tools and authorization allow. If a person must reconnect an account or make a choice, explain that one action with its real link. A failed preview does not mean the current website is down.

“Discard the draft” means remove only the unfinished work from this request; preserve the published record and other people's changes. Read the result back. “Undo the website change” means restore only that change, check a new preview and follow the normal approval route. Do not delete shared assets or promise recovery before it is verified.
