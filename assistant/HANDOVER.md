# Library handoff

The library owns its ChatGPT Plus, GitHub implementation repository and library Cloudflare account. ChatGPT is **@cottonwoodlibrary**; GitHub is **librarycottonwood**. The separate redesign repository is not the maintained implementation. Nothing library-related is hosted on Jaden's personal Cloudflare account; all previews and the live website use the library account.

## Current entry points

- Chat: questions, writing and connected reports. Analytics remains a read-only connector; Givebutter reports use the existing official plugin.
- Work with Sanity: supported content drafting/corrections. Actual Studio: https://cottonwood-community-library.sanity.studio/ . Content remains in project `2ou0xy2r` / `production`.
- Codex: the existing **cottonwood-library-editor** and maintained repository. Each website request gets a new worktree/branch/PR and a current-content preview URL. Ask “Ready to save?”, then handle conflicts, merge after explicit approval, verify the live website and clean up task-owned work. Details: `WORKFLOW.md`.
- Live website: https://cottonwood-library.pages.dev/ . The cottonwoodcommunitylibrary.com domain is attached to it at the public launch, moved from Tuesday, November 3 to Thursday, November 5, 2026 at the latest.
- Weekly summary: the existing Monday-afternoon cloud task; verify its actual binding and result in setup-status.json.

## Status — November 5, 2026

- Content saves work end to end in the library ChatGPT: Sanity edit → `content/*` PR → **Website preview** → “Ready to save?” → merge → **Live website**.
- Codex in the library account works for code changes (tested November 2 in Safari, environment `cottonwood-library-editor`): a plain-words request opened a PR with a preview and asked “Ready to save?”. On November 5 it couldn't run checks (`pnpm install` failed creating `~/.local/share/pnpm`); fixed by adding non-secret environment variables that point pnpm's folders at `/workspace` (`XDG_DATA_HOME`, `XDG_CACHE_HOME`, `XDG_CONFIG_HOME`, `npm_config_cache`, `PNPM_HOME`), then `pnpm install` and `pnpm check` passed. The unused backup environment `cottonwood-library-editor-recovery` was deleted the same day; `cottonwood-library-editor` is the only one.
- The automatic repair job (`upkeep.yml`) was restored and rehearsed on November 2. The weekly report also flags GitHub-only alarms (needs-attention issues, failed repairs, auto-closed saves).
- Changing files under `plugins/` does not update the installed ChatGPT plugin; upload the new version after it merges. PR #68 (launch prep) bumps it to 0.2.21 and is uploaded at launch.
- The old trial Cloudflare Pages project (`cottonwood-library-trial-preview`) was deleted November 5. The live project `cottonwood-library` is unaffected.

## Wizard tests — November 5, 2026

Each guided request was tried in the library ChatGPT.

- Closure notice, then undoing it: **passed** (PRs #100 and #101).
- Newsletter email draft: **passed**.
- Fundraiser: got stuck when the Givebutter Form code wasn't known. Fixed in PR #102.
- Undo: left a hidden Sanity draft behind. Fixed in PR #102.
- Monday reminder: was set up without asking first, and “stop” only paused it. Fixed in PR #102.
- Putting a newsletter issue on the website: **passed** up to the preview (test PDF, not saved, then cleaned up; PR #105 closed). Problems: two “blocked by safety checks” publish failures before it worked, 5 “Allow” prompts, jargon, and it couldn't close its own PR, so it told the volunteer to email Todd. The retry fix is in PR #102; the PR-closing fix is in this PR.
- Spam check on the newsletter form (Turnstile): **working** (checked November 5; server rejects sign-ups without it, and the new domain is already allowed).

Volunteers get the #102 fixes only when the ChatGPT plugin is uploaded at launch (0.2.21, with PR #68).

## Connected work to preserve

General donations use **Support Your Local Library**, campaign `655849` / `R62NJU`. Newsletter signup is the website's own form, which tags contacts **Library Newsletter** (the old widget `L4EVDm` is retired). Checkout opening, signup and one expressly approved inbox delivery passed; no payment or bulk email was sent. Actual sender/audience details are in `COMMUNICATIONS.md`.

Buffer has the library Facebook channel and an unscheduled test draft. Instagram remains the board's later action. Squarespace registrar access was recovered; DNS, nameservers and forwarding remain unchanged. Keep registration at Squarespace for the documented launch plan; no transfer is implied. See `DOMAIN-LAUNCH.md` and `ROADMAP.md`.

## Remaining handoff gates

Accounts the website depends on, and who owns them: `ACCOUNTS.md` (draft for the board to review). Open items and dates are in `ROADMAP.md`: launch-day checks, CMS backups and a restore rehearsal, a backup library administrator, the Sanity nonprofit decision, and volunteers running the workflow without Jaden. Preserve “Allow read-only tools”; do not grant all tools.

Canonical volunteer instructions live in `plugins/cottonwood-library/skills/`; `CODEX.md` holds account wording and `START.md` the editing entry point. `setup-status.json` separates installed/deployed state from proposals and historical evidence. `MAINTENANCE.md` retains the bounded repair policy. Never overwrite another task's worktree.
