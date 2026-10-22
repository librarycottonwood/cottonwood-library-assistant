---
name: publishing
description: Use when a volunteer asks how to use Sanity, whether a content change reached the website, or needs help with a failed update, reconnecting the editor, discarding a draft, or undoing a website change.
---

# Library publishing help

Follow library-assistant for conversation. Read `assistant/CMS.md` for the current editor and connections, `assistant/WORKFLOW.md` for website previews and saving, and `assistant/MAINTENANCE.md` when a check or update failed. Read those files from current main, not a past chat.

## Help with the editor

Find out what they are trying to change, then use the relevant topic wizard. Read the current record and schema through the available Sanity tools. Having the Cottonwood instructions installed does not connect Sanity; verify that connection separately.

If Sanity is disconnected, use its actual reconnect screen. Give one step with its link, then wait. Never ask for credentials. After reconnecting, repeat the original read or edit. Do not ask them to install an already installed plugin, buy a service, or move routine content into GitHub.

If the connected tools cannot do the edit, offer the actual editor as a fallback and guide them through it using the field labels in `assistant/content/`. Ask only the next missing question. Routine editing does not need project, dataset or account changes. A broader administrator identity is not permission to change those settings.

## Where is my change?

Read the actual CMS record and current publishing evidence. Explain the next unfinished step in one sentence:

- For a private CMS draft, show its proposed content in this conversation and ask whether to prepare the website preview. After confirmation, use the available supported CMS document publishing tool, honoring write confirmations. Do not direct the volunteer to Studio for a supported operation. The current website preview does not read private drafts.
- Publishing the CMS record queues a checked website preview. Use `library_website_updates` to find its check, then `library_website_preview` for the actual affected page. Show the returned picture in this conversation; the website link is optional exploration. Keep the opaque version for saving unchanged.
- Ask “Would you like me to save this?” here after showing the checked picture. When they agree, call `library_save_website_preview` with that exact version. ChatGPT confirms the write in chat. Never require a separate website approval button for this connected workflow.
- After saving, read `library_website_updates` and wait for `deployed_verified` before saying it is updated. Do not loop rapidly or turn a queued update into success. If a preview expired, refresh with the supported tool and show it again; if connection permissions are missing, reconnect the library connector rather than sending the volunteer to a review page.

Do not repeat an approval already given for the unchanged checked version. If that version changed or expired, prepare a fresh one. Do not present sample-content pictures as the library's current content.

## Fix, discard or undo

For a failure, first establish whether the existing website is working and what the repair system has already attempted. Handle what the available tools and authorization allow. If a person must reconnect an account or make a choice, explain that one action with its real link. A failed preview does not mean the current website is down.

“Discard the draft” means remove only the unfinished work from this request; preserve the published record and other people's changes. Read the result back. “Undo the website change” means restore only that change, check a new preview and follow the normal approval route. Do not delete shared assets or promise recovery before it is verified.
