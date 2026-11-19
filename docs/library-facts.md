# Library facts

Verified facts the assistant and staff can rely on. Check the live record before acting on anything that may have changed. Last reviewed November 19, 2026. No passwords, keys or account sign-in details belong here; those are in the private account directory in the library ChatGPT Maintenance project (Sources).

## The library

- Cottonwood Community Library, 3427 Main Street, Cottonwood, CA. Mail: PO Box 1807, Cottonwood, CA 96022.
- Phone (530) 347-4818. Email cottonlib@shasta.com.
- Technical support: ChatGPT, the library’s assistant. Board members (Todd Haines, Donna, Mary Ann, Rod and the rest) and volunteers are not technical; never send them technical work or tell anyone to contact them for it.
- Hours, address and contact details shown on the site come from Sanity (`library-settings` → Contact and hours). Change them there, never in code.

## Website

- Live: https://www.cottonwoodcommunitylibrary.com/ since November 5, 2026 (Cloudflare Pages project `cottonwood-library` on the library's Cloudflare account, also at https://cottonwood-library.pages.dev/). Previews: `https://<8 hex>.cottonwood-library.pages.dev`.
- Domain `cottonwoodcommunitylibrary.com` is registered at Squarespace; the bare domain forwards to www. Setup and rollback: `assistant/DOMAIN.md`.
- GitHub: `librarycottonwood/cottonwood-library-assistant`.
- Sanity: project `2ou0xy2r`, dataset `production`. Editor: https://cottonwood-community-library.sanity.studio/
- CMS publisher Worker (webhooks, admin recovery page): https://cottonwood-library-cms-publisher.librarycottonwood.workers.dev/

## Donations (Givebutter)

- Fundraiser on the website (`/donate/`): **Under One Roof** (new roof), code `CUDTG7`, https://givebutter.com/c/underoneroof, goal $28,000, Form widget `jwyYlq`.

- General donations campaign: **Support Your Local Library**, code `R62NJU`, page https://givebutter.com/support-your-local-library-r62nju
- Public widget account `D4OkqF0zVDUb7Rdx`. These are saved in Sanity `library-settings` (`library.givebutter.account`, `library.givebutter.campaign`, `library.donationUrl`).
- A fundraiser is separate: it lives in Sanity `library-giving` → `campaigns[]` with its own Givebutter **Form** widget ID (goal bar on). Live totals come from Givebutter only.
- Creating widgets in Givebutter needs the Admin or Finance role there.

## Newsletter

- Website issues: Sanity **Newsletters** records plus `library-settings.currentNewsletter`.
- Email: Givebutter **Engage → Email** (drafts and sending).
- Sender: Cottonwood Community Library <newsletter@cottonwoodlibrary.givebutter-mail.com>, replies to cottonlib@shasta.com.
- Sign-ups: the website's own form (footer of every page and `/newsletter/`) posts to `/api/newsletter` (`functions/api/newsletter.ts`), which adds a Givebutter contact with email subscription on and the tag **Library Newsletter**. Needs the `GIVEBUTTER_API_KEY` and `TURNSTILE_SECRET_KEY` secrets (see "Website secrets" below).
- Audience: Contacts tagged **Library Newsletter**, excluding unsubscribed. That one tag is the whole list (the old signup widget `L4EVDm` was only used for setup testing and is not a second audience). Donors are not automatically subscribers.
- Tested: website sign-up end to end (October 30, 2026) and Givebutter email delivery (October 21, 2026). Unsubscribe: handled by Givebutter's built-in link; not tested by us (accepted November 5).
- Each send needs board approval of the issue and audience.

## Social

- Buffer has the library Facebook page. Instagram is not connected yet.
- Posts are created as Buffer drafts for a person to approve. Nothing is published straight from the assistant.

## Visitor statistics

- Google Analytics property `557596091`, "Cottonwood Community Library website" (measurement ID in `src/content/analytics.json`), consent-gated, counting visits to the new site only.
- The `connector/` Worker serves these reports to the library's ChatGPT (see `connector/README.md`).

## Events

- Under One Roof auction: Saturday, November 14, 2026. Settled: follow the library's public posts; don't raise the date again.

## Website secrets

Set in Cloudflare (library account) → Workers & Pages → `cottonwood-library` → Settings → Variables and Secrets, type **Secret**, environment **Production** only. Never paste a value into chat, GitHub or any file.

- `GIVEBUTTER_API_KEY`: Givebutter API key (Settings → Integrations → API Keys, named `Library website newsletter`) used by the newsletter form. Without it the form shows "Sorry, sign-up isn't working right now". To replace a leaked or old key: create a new one, replace the secret, then delete the old key in Givebutter.
- `TURNSTILE_SECRET_KEY`: Cloudflare Turnstile widget "Cottonwood newsletter form". Its public site key is in `src/content/newsletter-signup.json`; allowed hostnames are `cottonwood-library.pages.dev`, `cottonwoodcommunitylibrary.com` and `www.cottonwoodcommunitylibrary.com`.

A changed secret applies from the next website save.
