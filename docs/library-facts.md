# Library facts and accounts

Verified facts Claude and staff can rely on. Check the live record before acting on anything that may have changed. Last reviewed October 2026. No passwords or keys belong here.

## The library

- Cottonwood Community Library, 3427 Main Street, Cottonwood, CA. Mail: PO Box 1807, Cottonwood, CA 96022.
- Phone (530) 347-4818. Email cottonlib@shasta.com. Library Google account: librarycottonwood@gmail.com.
- Board admin (the contact for anything that "needs a board admin"): Todd Haines (toddhaines7@gmail.com). Not technical; he decides account, billing and permission questions and brings in technical help.
- Hours, address and contact details shown on the site come from Sanity (`library-settings` → Contact and hours). Change them there, never in code.

## Website

- AI Expo: Tuesday, November 3, 2026. Public launch moved to Thursday, November 5, 2026 at the latest. The domain is attached at launch (`docs/domain-launch.md`).

- Live: https://cottonwood-library.pages.dev/ (Cloudflare Pages project `cottonwood-library` on the library's Cloudflare account). Previews: `https://<8 hex>.cottonwood-library.pages.dev`.
- Public domain `cottonwoodcommunitylibrary.com` (registered at Squarespace) is not attached yet. Plan: `docs/domain-launch.md`.
- GitHub: `librarycottonwood/cottonwood-library-assistant`.
- Sanity: project `2ou0xy2r`, dataset `production`. Editor: https://cottonwood-community-library.sanity.studio/
- CMS publisher Worker (webhooks, admin recovery page): https://cottonwood-library-cms-publisher.librarycottonwood.workers.dev/

## Donations (Givebutter)

- Fundraiser not yet on the website: **Under One Roof** (new roof), code `CUDTG7`, https://givebutter.com/c/underoneroof, goal $28,000, Form widget `jwyYlq` (turn its goal bar on first).

- General donations campaign: **Support Your Local Library**, code `R62NJU`, page https://givebutter.com/support-your-local-library-r62nju
- Public widget account `D4OkqF0zVDUb7Rdx`. These are saved in Sanity `library-settings` (`library.givebutter.account`, `library.givebutter.campaign`, `library.donationUrl`).
- A fundraiser is separate: it lives in Sanity `library-giving` → `campaigns[]` with its own Givebutter **Form** widget ID (goal bar on). Live totals come from Givebutter only.
- Creating widgets in Givebutter needs the Admin or Finance role there.

## Newsletter

- Website issues: Sanity **Newsletters** records plus `library-settings.currentNewsletter`.
- Email: Givebutter Engage. Drafts and sending: https://dashboard.givebutter.com/accounts/170378/engage/email
- Sender: Cottonwood Community Library <newsletter@cottonwoodlibrary.givebutter-mail.com>, replies to cottonlib@shasta.com.
- Sign-ups: the website's own form (footer of every page and `/newsletter/`) posts to `/api/newsletter` (`functions/api/newsletter.ts`), which adds a Givebutter contact with email subscription on and the tag **Library Newsletter**. Needs the `GIVEBUTTER_API_KEY` secret in Cloudflare Pages (see `docs/setup-checklist.md`).
- Audience: Contacts tagged **Library Newsletter**, plus earlier **Widget form sign-ups → Library Newsletter** (the old signup widget `L4EVDm`, no longer on the site), excluding unsubscribed. Donors are not automatically subscribers.
- Still open before the first bulk send: an unsubscribe test, and board approval of the first issue and audience.

## Social

- Buffer (signed in with the library Google account) has the library Facebook page. Instagram is not connected yet.
- Posts are created as Buffer drafts for a person to approve. Nothing is published straight from Claude.

## Visitor statistics

- Google Analytics demo property `557596091` (measurement ID in `src/content/analytics.json`), consent-gated, counting visits to the new site only.
- The `connector/` Worker served these reports to ChatGPT. Whether Claude uses it is an open decision (see `connector/README.md`).

## Open questions

- Under One Roof auction: Givebutter (unpublished) says Nov 2, 1:00 a.m. to Nov 5, 9:00 a.m.; Donna's letter and the website say Saturday, Nov 14. Ask before repeating either.
