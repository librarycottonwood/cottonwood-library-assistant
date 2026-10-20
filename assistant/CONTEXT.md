# Library context

Cottonwood Community Library serves Cottonwood, California. Timezone: America/Los_Angeles.
This repository holds the custom library website and conversational upkeep pilot. Jaden reports the board accepted the pivot from Squarespace at the October 6 meeting and wants a six-week trial of preview edits and connected reports. The existing public website is unchanged; launch and publishing are separate. Library copy still needs board review before launch.

The website is static Astro with Node 24 and pnpm 11.15.1. No payment collection or form backend is configured here. Cloudflare Pages can host the static output; additional Pages Functions can be added when an actual request needs them.

Content management is being moved to Sanity; read `assistant/CMS.md` before editing. The implementation is present, but library Google sign-in, project creation, nonprofit application, ChatGPT connection, hosting and live publishing tests are still pending. No additional paid subscription is authorized.

With `LIBRARY_CONTENT_SOURCE=sanity`, published CMS records feed one validated snapshot per build through `src/content/repository.ts`. Studio forms live in `studio/`; signed publishing/review logic in `cms-publisher/`. Native CMS publication and verified website deployment are distinct. The new CMS trial is isolated from the saved trial and real domain. Until the account is configured, the default local prototype uses these migration inputs:
- Homepage heading, hours, programs: `src/content/seed.ts`.
- Stories/news/events: `src/content/editorial.ts` and `src/content/feeds.ts`.
- Giving: `src/content/support.ts`.
- Images: `src/content/images.ts`, `library-files/`, and `public/`.

Source provenance is recorded in `assistant/source.json`. Only website source and referenced public-facing assets were copied; unrelated research, emails, and working files were excluded.

The library owns the GitHub repository, Cloudflare account and ChatGPT Plus account. ChatGPT display handle is @cottonwoodlibrary; GitHub remains librarycottonwood. Keep recovery access with the board. Current account/setup evidence is in assistant/setup-status.json.

## Analytics, communications, and fundraising

The assistant role includes answering questions about website traffic, recent post performance, and Givebutter fundraising, alongside website changes and everyday library support. A separate Google Analytics demo account/property has been created, with consent-gated website tracking. It measures new demo visits only. The library-owned ChatGPT Plus account now has the official Givebutter plugin connected and tested. That connection is not automatically available in every Codex environment. Website-visitor reports from the demo Google Analytics property are connected through the library report tool. Social account insights are not connected; social posting is planned through Buffer. A public post or campaign page does not establish access to private analytics. Check the current tools and permissions before answering from an account; use supplied exports when available. The content repository is not a source of live performance figures.
