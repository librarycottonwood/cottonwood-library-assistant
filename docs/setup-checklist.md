# Claude Code setup checklist (Tuesday meeting)

Moving the library from ChatGPT to Claude Code. Do these in order. Keep ChatGPT working until the last step.

## 1. Accounts

- [ ] **Goodstack nonprofit verification** for Anthropic's nonprofit pricing (library EIN and documents; can take a few days).
- [ ] **Claude Team plan, 2 seats**, owned by a library email (librarycottonwood@gmail.com), not a personal one. Seat 1: library account (staff use, owns the scheduled tasks). Seat 2: board admin or Jaden until handover.
- [ ] Turn on **Claude Code** for the team (Admin settings → Claude Code).

## 2. GitHub

- [ ] Install the **Claude GitHub App** on the `librarycottonwood` org, only for `cottonwood-library-assistant`.
- [ ] Merge the `claude/fresh-setup` branch (this setup) through the normal PR + preview flow.
- [ ] **Branch protection / ruleset** on `main`: require a pull request, require the `check` workflow, block force-pushes and deletion. Claude's own rules can't stop everything; GitHub is the real lock.
- [ ] **Ruleset on `maintenance-reports`**: block deletion and force-pushes (the workflow still writes to it).
- [ ] Repo setting: **automatically delete head branches** after merge.

## 3. Claude Code on the web

- [ ] At https://claude.ai/code, connect GitHub and pick `librarycottonwood/cottonwood-library-assistant`.
- [ ] Create a cloud environment named **Cottonwood Library**:
  - Network access: **Custom**, keep the default trusted list and add `*.sanity.io`, `*.apicdn.sanity.io`, `cdn.sanity.io`, `cottonwood-library.pages.dev`, `*.cottonwood-library.pages.dev`.
  - Setup script: none needed (the repo's SessionStart hook installs Node 24 + pnpm and runs `pnpm install`).
  - No secrets in environment variables.
- [ ] Tell staff: always start a **session on the repository**, not a Claude "Project". The repo's safety rules only apply in repository sessions.

## 4. Connectors (library account)

- [ ] **Sanity**: connect and sign in with the library's Sanity account (editor role is enough).
- [ ] **Buffer**: connect (Facebook page linked in Buffer; Instagram later).
- [ ] **Givebutter**: no Claude connector known yet; totals are read in Givebutter for now.

## 4b. Newsletter sign-up key (board admin, once)

The website's own newsletter form sends sign-ups to Givebutter with an API key. Until the key is added, the form shows "Sorry, sign-up isn't working right now" with a link to email the library.

- [ ] In Givebutter (Admin role): **Settings → Integrations → API Keys → Create New API Key**, named `Library website newsletter`. Copy it once; don't paste it into chat, GitHub or any file.
- [ ] In Cloudflare (library account): **Workers & Pages → `cottonwood-library` → Settings → Variables and Secrets → Add**. Type **Secret**, name `GIVEBUTTER_API_KEY`, paste the key, environment **Production** (add it to **Preview** too if previews should be able to subscribe real people). Save.
- [ ] It applies from the next website save (publish). Then sign up on the live site with a test address and check that the contact appears in Givebutter with the **Library Newsletter** tag and email subscription on.
- [ ] In Givebutter Engage, make the newsletter audience **tag = Library Newsletter** (keep the old *Widget form sign-ups → Library Newsletter* people too), excluding unsubscribed.
- To replace a leaked or old key: create a new one, replace the Cloudflare secret, then delete the old key in Givebutter.
- [ ] **Visitor reports**: decide whether to keep the `connector/` Worker as a Claude custom connector (see `connector/README.md`) or use Google Analytics directly.

## 5. Scheduled tasks (signed in as the library account)

At https://claude.ai/code/routines → **New task**, repository `cottonwood-library-assistant`, environment **Cottonwood Library**:

- [ ] **Daily maintenance**: daily, 6:17 a.m. Prompt: `Follow .claude/routines/daily-maintenance.md in the repository.` Connectors: none.
- [ ] **Weekly check-in**: Mondays, 8:07 a.m. Prompt: `Follow .claude/routines/weekly-check-in.md in the repository.` Connectors: Sanity (read).
- [ ] Click **Run now** on each once. Check the result.
- [ ] Watchers: staff/board who want the weekly email "watch" the repo issues on GitHub.

## 6. Smoke test (together, on screen)

- [ ] Staff member opens a new session and asks: "Add a news post saying we have new large-print books."
- [ ] Claude asks questions → drafts → opens a PR → sends the preview link.
- [ ] Check the preview. Answer **yes** to "Ready to save?". Approve the merge prompt.
- [ ] Confirm the post on https://cottonwood-library.pages.dev/ within ~10 minutes.
- [ ] Try a blocked action ("delete the maintenance-reports branch") and see Claude refuse.
- [ ] Remove the test post the same way (or keep it if it's real).

## 7. Cutover

- [ ] Keep ChatGPT running **1-2 weeks** alongside Claude.
- [ ] After two weeks of clean saves, cancel the ChatGPT plan and remove its GitHub/Sanity access.
- [ ] Hand over: board admin knows where `docs/staff-guide.md` and this checklist live.
