# Claude Code setup checklist

Moving the library from ChatGPT to Claude Code. **On hold (Oct 29):** staff keep using ChatGPT for now; the launch items under Status still apply. When the move resumes, do these in order and keep ChatGPT working until the last step.

**Public launch and AI Expo: Tuesday, November 3, 2026** (replaces the earlier November 16 plan).

## Status (checked October 27, 2026)

Done:
- Givebutter API key created (account 170378, named `Library website newsletter`; the name is only a nickname, the key has full account access).
- Saved as the encrypted Cloudflare secret `GIVEBUTTER_API_KEY` in project `cottonwood-library`, **Production** only, and confirmed after a reload. Preview has no key.
- Roof fundraiser found in Givebutter: **Under One Roof**, campaign code `CUDTG7`, https://givebutter.com/c/underoneroof, goal $28,000, Active. Form widget ID `jwyYlq`.

Still open before launch:
- [ ] **Deploy and test the newsletter.** The key only works after the next deployment. Then sign up with an approved test address (see 4b). Nobody has tested it yet.
- [ ] **Roof fundraiser on the website** (see 4c). Turn the goal bar on in its Form widget first; it was off.
- [ ] **Auction dates.** Givebutter's auction (unpublished) says Nov 2, 1:00 a.m. to Nov 5, 9:00 a.m.; Donna's letter and the website calendar say Saturday, Nov 14. Confirm with the library which is right before anyone changes either.
- [ ] **Domain.** Confirm access to the Squarespace domain and keep its DNS records before launch or any transfer. The Spaceship account exists (username `cottonwoodcommunitylibrary`, librarycottonwood@gmail.com); no transfer started.
- [ ] **Claude nonprofit/Team setup** (sections 1 to 3).
- [ ] **Image generation**: an OpenAI API account and key for the picture skill (staff rely on this in ChatGPT; see 4d).
- [ ] **Claude creating or changing Givebutter campaigns**: not wired up. The Givebutter connector in ChatGPT is read-only.
- [x] **Spam protection for the newsletter form** (see 4f). Set up Oct 27; turns on when this PR goes live.
- [x] **Pipeline fixes:** PR #52 and #53 merged Oct 28; Studio deployed, ChatGPT plugin updated to 0.2.15, and #45 switched to one file per save.
- [ ] **Name a board admin** for "a board admin needs to look at this" messages, and put their name and contact in `CLAUDE.md` and `docs/library-facts.md`.
- [x] **Google Analytics:** property renamed to "Cottonwood Community Library website" (Oct 27).
- [ ] **Launch day:** add a Google Analytics annotation; numbers before Nov 3 are test traffic.

## 1. Accounts

- [ ] **Goodstack nonprofit verification** for Anthropic's nonprofit pricing (library EIN and documents; can take a few days).
- [ ] **Claude Team plan, 2 seats**, owned by a library email (librarycottonwood@gmail.com), not a personal one. Seat 1: library account (staff use, owns the scheduled tasks). Seat 2: board admin or Jaden until handover.
- [ ] Turn on **Claude Code** for the team (Admin settings → Claude Code).

## 2. GitHub

- [ ] Install the **Claude GitHub App** on the `librarycottonwood` org, only for `cottonwood-library-assistant`.
- [x] Merge the `claude/fresh-setup` branch (this setup): merged Oct 28 as PR #45.
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
- [ ] **Givebutter**: Givebutter's AI connector is read-only (totals, campaigns, contacts). Creating or editing campaigns needs the API key and a skill that isn't built yet.

## 4b. Newsletter sign-up key (board admin, once)

The website's own newsletter form sends sign-ups to Givebutter with an API key. Until the key is added, the form shows "Sorry, sign-up isn't working right now" with a link to email the library.

- [x] In Givebutter (Admin role): **Settings → Integrations → API Keys → Create New API Key**, named `Library website newsletter`. Copy it once; don't paste it into chat, GitHub or any file. *(Done October 27.)*
- [x] In Cloudflare (library account): **Workers & Pages → `cottonwood-library` → Settings → Variables and Secrets → Add**. Type **Secret**, name `GIVEBUTTER_API_KEY`, paste the key, environment **Production** (add it to **Preview** too if previews should be able to subscribe real people). Save. *(Done October 27, Production only.)*
- [ ] It applies from the next website save (publish), and the form itself ships with the `claude/fresh-setup` merge. Then sign up on the live site with a test address and check that the contact appears in Givebutter with the **Library Newsletter** tag and email subscription on.
- [ ] In Givebutter Engage, make the newsletter audience **tag = Library Newsletter** (keep the old *Widget form sign-ups → Library Newsletter* people too), excluding unsubscribed.
- To replace a leaked or old key: create a new one, replace the Cloudflare secret, then delete the old key in Givebutter.

## 4c. Roof fundraiser on the website

- [ ] In Givebutter, open **Under One Roof** → **Sharing** → **Widgets** → gear on the **Form** box → turn **Goal bar** on → **Save**. (Widget `jwyYlq` had it off.)
- [ ] Add it to Sanity `library-giving` → `campaigns[]` with the `fundraisers` skill: title, short description, `url` https://givebutter.com/c/underoneroof, `givebutter.formWidgetId` `jwyYlq`, `givebutter.campaign` `CUDTG7`. The homepage badge and every Donate button then switch to it.
- [ ] Check the preview: badge above the homepage heading, Donate popup opens the roof campaign, goal bar shows on the Donate page.

## 4d. Picture generation

- [ ] OpenAI API account for the library (separate from ChatGPT Plus), small prepaid balance, key saved as a secret only.
- [ ] Build the picture skill (follows `website-save` → "Picture shape and dead zones") and test it with one event picture.

## 4e. Visitor reports

- [ ] **Visitor reports**: decide whether to keep the `connector/` Worker as a Claude custom connector (see `connector/README.md`) or use Google Analytics directly.

## 4f. Newsletter spam protection (Cloudflare Turnstile, free)

- [x] Turnstile widget "Cottonwood newsletter form" created (Managed, hostname `cottonwood-library.pages.dev`). Add the new domain to it at the domain switch.
- [x] Site key is in `src/content/newsletter-signup.json` (it's public).
- [x] Secret key saved in Cloudflare → `cottonwood-library` → Variables and Secrets → Production as `TURNSTILE_SECRET_KEY`. Never paste it in a chat.
- [ ] After the next publish, sign up with a test address and check it reaches Givebutter.

## 4g. After launch

- [ ] **Givebutter skill** so Claude can create and update campaigns (and their dates) with the API key, instead of staff clicking through Givebutter. Needs a small server action that holds the key; the key is never given to the assistant.
- [ ] **Test pasted photos** in a Claude cloud session on the library account (a pasted image may have no file to upload). Fix the photo steps if it fails.
- [ ] **Test that maintenance alerts reach someone.** Run the daily routine once and check who gets the GitHub email; if nobody reads it, pick a channel staff do read.

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
- [ ] Then open a PR that deletes `AGENTS.md`, `assistant/` and `plugins/`.
- [ ] Hand over: board admin knows where `docs/staff-guide.md` and this checklist live.
