# Website setup checklist

Account and launch setup for the library website. Staff update the site through the library's ChatGPT (`plugins/cottonwood-library/`); the earlier plan to move to Claude was dropped on November 5, 2026.

**Public launch: Thursday, November 5, 2026.** The site is live at https://www.cottonwoodcommunitylibrary.com.

## Status (updated November 5, 2026)

Done:
- Givebutter API key created (account 170378, named `Library website newsletter`; the name is only a nickname, the key has full account access).
- Saved as the encrypted Cloudflare secret `GIVEBUTTER_API_KEY` in project `cottonwood-library`, **Production** only, and confirmed after a reload. Preview has no key.
- Roof fundraiser found in Givebutter: **Under One Roof**, campaign code `CUDTG7`, https://givebutter.com/c/underoneroof, goal $28,000, Active. Form widget ID `jwyYlq`.

Launch items:
- [x] **Deploy and test the newsletter.** Website sign-up tested end to end October 30, 2026; Givebutter email delivery tested October 21, 2026. Unsubscribe: handled by Givebutter's built-in link; not tested by us (accepted November 5).
- [x] **Roof fundraiser on the website** (`/donate/`).
- [x] **Auction date:** Saturday, November 14. Settled; follow the library's public posts.
- [x] **Domain.** Access to the Squarespace domain is confirmed. The domain points to the website since November 5 (`assistant/DOMAIN.md`). The Spaceship account exists (username `cottonwoodcommunitylibrary`, librarycottonwood@gmail.com); no transfer started.
- [ ] **Image generation**: an OpenAI API account and key for the picture skill (staff rely on this in ChatGPT; see section 4).
- [ ] **The assistant creating or changing Givebutter campaigns**: not wired up. The Givebutter connector in ChatGPT is read-only.
- [x] **Spam protection for the newsletter form** (see section 6). Set up Oct 27; turns on when this PR goes live.
- [x] **Pipeline fixes:** PR #52 and #53 merged Oct 28; Studio deployed, ChatGPT plugin updated to 0.2.15, and #45 switched to one file per save.
- [x] **Google Analytics:** property renamed to "Cottonwood Community Library website" (Oct 27).
- [x] **Launch day:** Google Analytics annotation added November 5; numbers before that day are test traffic.

## 1. GitHub

- [ ] **Branch protection / ruleset** on `main`: require a pull request, require the `check` workflow, block force-pushes and deletion. The assistant's own rules can't stop everything; GitHub is the real lock.
- [ ] **Ruleset on `maintenance-reports`**: block deletion and force-pushes (the workflow still writes to it).
- [ ] Repo setting: **automatically delete head branches** after merge.

## 2. Newsletter sign-up key (once)

The website's own newsletter form sends sign-ups to Givebutter with an API key. Until the key is added, the form shows "Sorry, sign-up isn't working right now" with a link to email the library.

- [x] In Givebutter (Admin role): **Settings → Integrations → API Keys → Create New API Key**, named `Library website newsletter`. Copy it once; don't paste it into chat, GitHub or any file. *(Done October 27.)*
- [x] In Cloudflare (library account): **Workers & Pages → `cottonwood-library` → Settings → Variables and Secrets → Add**. Type **Secret**, name `GIVEBUTTER_API_KEY`, paste the key, environment **Production** (add it to **Preview** too if previews should be able to subscribe real people). Save. *(Done October 27, Production only.)*
- [x] It applies from the next website save (publish), and the form itself shipped with PR #45. Then sign up on the live site with a test address and check that the contact appears in Givebutter with the **Library Newsletter** tag and email subscription on. *(Tested end to end October 30.)*
- [ ] In Givebutter Engage, make the newsletter audience **tag = Library Newsletter** (keep the old *Widget form sign-ups → Library Newsletter* people too), excluding unsubscribed.
- To replace a leaked or old key: create a new one, replace the Cloudflare secret, then delete the old key in Givebutter.

## 3. Roof fundraiser on the website

- [ ] In Givebutter, open **Under One Roof** → **Sharing** → **Widgets** → gear on the **Form** box → turn **Goal bar** on → **Save**. (Widget `jwyYlq` had it off.)
- [ ] Add it to Sanity `library-giving` → `campaigns[]` with the `fundraisers` skill: title, short description, `url` https://givebutter.com/c/underoneroof, `givebutter.formWidgetId` `jwyYlq`, `givebutter.campaign` `CUDTG7`. The homepage badge and every Donate button then switch to it.
- [ ] Check the preview: badge above the homepage heading, Donate popup opens the roof campaign, goal bar shows on the Donate page.

## 4. Picture generation

- [ ] OpenAI API account for the library (separate from ChatGPT Plus), small prepaid balance, key saved as a secret only.
- [ ] Build the picture skill (follows `website-save` → "Picture shape and dead zones") and test it with one event picture.

## 5. Visitor reports

- [x] **Visitor reports**: the `connector/` Worker is the ChatGPT visitor-report connector (see `connector/README.md`).

## 6. Newsletter spam protection (Cloudflare Turnstile, free)

- [x] Turnstile widget "Cottonwood newsletter form" created (Managed, hostname `cottonwood-library.pages.dev`). The new domain (bare and `www.`) was already added.
- [x] Site key is in `src/content/newsletter-signup.json` (it's public).
- [x] Secret key saved in Cloudflare → `cottonwood-library` → Variables and Secrets → Production as `TURNSTILE_SECRET_KEY`. Never paste it in a chat.
- [x] After the next publish, sign up with a test address and check it reaches Givebutter. *(October 30 sign-up test. November 5: the server rejects sign-ups without a valid Turnstile answer, and `cottonwoodcommunitylibrary.com` and `www.` are already allowed hostnames.)*

## 7. After launch

- [ ] **Givebutter skill** so the assistant can create and update campaigns (and their dates) with the API key, instead of staff clicking through Givebutter. Needs a small server action that holds the key; the key is never given to the assistant.
- [ ] **Test that maintenance alerts reach someone.** Run the daily routine once and check who gets the GitHub email; if nobody reads it, pick a channel staff do read.
