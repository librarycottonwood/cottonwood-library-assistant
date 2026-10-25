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

Read the actual CMS record, PR and current publishing evidence. Explain the next unfinished step in one sentence.

- A private CMS draft is not published. Show its proposed content here and confirm facts before using the supported document publishing tool. Honor its write confirmation. The current website preview reads published records, not private drafts.
- For the website release, follow the existing Codex PR workflow in `assistant/WORKFLOW.md`. Use current CMS content and changed branch code. Share the working preview URL, then ask “Ready to save?” Keep pictures as internal evidence unless requested.
- After explicit approval, resolve conflicts, rerun affected checks and merge the PR. Verify the final workflow and the live website before saying it is saved. A source merge or queued deployment alone is not success.
- The flow is preview → live. Previews come only from that PR workflow on the library Cloudflare account; the live website is https://cottonwood-library.pages.dev. Never deploy from a computer, run `wrangler login`, or use a personal Cloudflare account.
- If source/content changes materially, prepare a fresh preview and ask again. Do not repeat approval for an unchanged checked version. Clean up only the completed task's branch/worktree after verification.

The reporting connector has no website-saving tools. Do not ask for website OAuth permissions, repeatedly reconnect it, or send volunteers to an external approval page for ordinary saves. The existing CMS review page remains an administrator recovery option when explicitly chosen. Do not present sample-content pictures as current content or imply a repository change repairs an external Codex browser error.

## Fix, discard or undo

For a failure, first establish whether the existing website is working and what the repair system has already attempted. Handle what the available tools and authorization allow. If a person must reconnect an account or make a choice, explain that one action with its real link. A failed preview does not mean the current website is down.

“Discard the draft” means remove only the unfinished work from this request; preserve the published record and other people's changes. Read the result back. “Undo the website change” means restore only that change, check a new preview and follow the normal approval route. Do not delete shared assets or promise recovery before it is verified.
