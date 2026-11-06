# Library accounts (draft for board review)

**Draft, November 5, 2026. The board should check every line before relying on it.** It lists only what this repository records. "Board to confirm" means the repository doesn't say. No passwords, keys or recovery codes belong here; keep those in the library's own password safe.

Board admin for account, billing and permission questions: Todd Haines (toddhaines7@gmail.com). Library Google account: librarycottonwood@gmail.com. Library email: cottonlib@shasta.com.

| Service | What it's for | Login that owns it | Who has admin | Plan / billing |
| --- | --- | --- | --- | --- |
| **GitHub** (account `librarycottonwood`, private repository `cottonwood-library-assistant`) | Website code, previews, checks, saves, weekly reports | `librarycottonwood` (sign-in email: Board to confirm) | `librarycottonwood` owns the repository; collaborator `oobagi` kept write access. Others: Board to confirm | Board to confirm. The repository notes a $0 overage limit, so checks and stored previews must fit the free allowance |
| **Cloudflare** (account `e05729fd6b6fad329e31896d8b1c2da9`) | Hosts the live website (Pages project `cottonwood-library`) and previews, the CMS publisher Worker, the visitor-report Worker, and the newsletter form's secrets | librarycottonwood@gmail.com | Board to confirm | CMS publisher and visitor-report Workers run on Workers **Free**; Pages plan: Board to confirm |
| **Cloudflare Turnstile** (in the same Cloudflare account) | Spam check on the newsletter sign-up form (widget "Cottonwood newsletter form") | Same Cloudflare account | Same as Cloudflare | Free |
| **Sanity** (organization `oprdu6k2x`, project `2ou0xy2r`, dataset `production`) | Website content: events, news, notices, newsletters, hours, pictures. Editor: https://cottonwood-community-library.sanity.studio/ | Signed in through GitHub as `librarycottonwood` | Backup administrator not set up yet (Board to confirm) | No paid plan. Nonprofit plan applied for October 20, 2026 (from librarycottonwood@gmail.com); decision pending |
| **Givebutter** (account `170378`) | Donations, the Under One Roof fundraiser, newsletter sign-ups and newsletter email (Engage) | cottonlib@shasta.com | Library admin access verified; named admins: Board to confirm | Board to confirm |
| **Email sending** (Givebutter Engage) | Sends the newsletter from newsletter@cottonwoodlibrary.givebutter-mail.com, replies go to cottonlib@shasta.com | Part of the Givebutter account | Same as Givebutter | Free Givebutter sending domain |
| **Library email** (cottonlib@shasta.com) | Library contact address; Givebutter login and domain registrant email | Board to confirm | Board to confirm | Board to confirm |
| **ChatGPT / Codex** (handle @cottonwoodlibrary) | The library assistant: chat, Sanity edits, website changes (Codex environment `cottonwood-library-editor`), weekly review, automatic repair sign-in | librarycottonwood@gmail.com | Board to confirm | ChatGPT **Plus**, library-owned. Who pays: Board to confirm |
| **Google Analytics** (account `410873133`, property `557596091`) | Visitor numbers for the new website | librarycottonwood@gmail.com (Administrator) | librarycottonwood@gmail.com; Jaden also still has access | No billing recorded. Google Cloud project `cottonwood-library-analytics` has no billing account |
| **Domain** `cottonwoodcommunitylibrary.com` (Squarespace) | The public web address, attached at launch. Registration and DNS stay at Squarespace | Squarespace sign-in: Board to confirm. Registrant on file: Mary Ann Hasbrook, cottonlib@shasta.com | Board to confirm | Renews March 7, 2027 for $15, auto-renew on |
| **Spaceship** (username `cottonwoodcommunitylibrary`) | Account made for a possible later domain transfer; not used, no transfer started | librarycottonwood@gmail.com | Board to confirm | Board to confirm |
| **Buffer** | Facebook (and later Instagram) post drafts for a person to approve | librarycottonwood@gmail.com | Board to confirm | Board to confirm |
| **Facebook Page** | Library posts, published through Buffer | Board members manage it from their own accounts | Board to confirm | Board to confirm |
| **Old Square website** (cottonwood-community-library.square.site) | Old site; the domain forwards there until launch | Board to confirm | Board to confirm | Has a subscription; cancel only with board approval after the new site is verified |

Not set up yet: the Claude Team plan (move to Claude is on hold) and an OpenAI API account for picture generation. See `docs/setup-checklist.md`.

## For the board to decide

- A second (backup) administrator for GitHub, Cloudflare, Sanity, Givebutter and the domain, so no single sign-in can lock the library out.
- Where account recovery details live, and who can reach them.
- Whether Jaden's Google Analytics access and the `oobagi` GitHub access stay after handoff.
- Who pays for each paid service after the semester.

Sources: `setup-status.json`, `HANDOVER.md`, `CONTEXT.md`, `COMMUNICATIONS.md`, `DOMAIN-LAUNCH.md`, `analytics.json`, `docs/library-facts.md`, `docs/setup-checklist.md`, `cms-publisher/README.md`, `connector/README.md`.
