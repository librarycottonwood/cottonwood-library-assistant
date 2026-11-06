# Library facts and accounts

Verified facts the assistant and staff can rely on. Check the live record before acting on anything that may have changed. Last reviewed November 5, 2026. No passwords or keys belong here.

## The library

- Cottonwood Community Library, 3427 Main Street, Cottonwood, CA. Mail: PO Box 1807, Cottonwood, CA 96022.
- Phone (530) 347-4818. Email cottonlib@shasta.com. Library Google account: librarycottonwood@gmail.com.
- Board admin (the contact for anything that "needs a board admin"): Todd Haines (toddhaines7@gmail.com). Not technical; he decides account, billing and permission questions and brings in technical help.
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
- Email: Givebutter Engage. Drafts and sending: https://dashboard.givebutter.com/accounts/170378/engage/email
- Sender: Cottonwood Community Library <newsletter@cottonwoodlibrary.givebutter-mail.com>, replies to cottonlib@shasta.com.
- Sign-ups: the website's own form (footer of every page and `/newsletter/`) posts to `/api/newsletter` (`functions/api/newsletter.ts`), which adds a Givebutter contact with email subscription on and the tag **Library Newsletter**. Needs the `GIVEBUTTER_API_KEY` secret in Cloudflare Pages (see `docs/setup-checklist.md`).
- Audience: Contacts tagged **Library Newsletter**, excluding unsubscribed. That one tag is the whole list (the old signup widget `L4EVDm` was only used for setup testing and is not a second audience). Donors are not automatically subscribers.
- Tested: website sign-up end to end (October 30, 2026) and Givebutter email delivery (October 21, 2026). Unsubscribe: handled by Givebutter's built-in link; not tested by us (accepted November 5).
- Still open before the first bulk send: the unsubscribe result, and board approval of the first issue and audience.

## Social

- Buffer (signed in with the library Google account) has the library Facebook page. Instagram is not connected yet.
- Posts are created as Buffer drafts for a person to approve. Nothing is published straight from the assistant.

## Visitor statistics

- Google Analytics property `557596091`, "Cottonwood Community Library website" (measurement ID in `src/content/analytics.json`), consent-gated, counting visits to the new site only.
- The `connector/` Worker serves these reports to the library's ChatGPT (see `connector/README.md`).

## Events

- Under One Roof auction: Saturday, November 14, 2026. Settled: follow the library's public posts; don't raise the date again.
