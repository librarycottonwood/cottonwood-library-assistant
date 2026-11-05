# Library context

Cottonwood Community Library serves Cottonwood, California. Timezone: America/Los_Angeles.
This repository holds the custom library website and conversational upkeep pilot. Jaden reports the board accepted the pivot from Squarespace at the October 6 meeting and wants a six-week pilot of preview edits and connected reports. The existing public website is unchanged; launch and publishing are separate. Library copy still needs board review before launch.

The website is static Astro with Node 24 and pnpm 11.15.1. Cloudflare Pages hosts the static output plus one Pages Function: the newsletter sign-up form posts to `/api/newsletter` (`functions/api/newsletter.ts`), which adds a Givebutter contact. Donations go through Givebutter checkout and widgets; the website itself stores no payments or donor data.

Content management uses Sanity; read `assistant/CMS.md` before editing. PR #22 is merged. The library-owned GitHub identity `librarycottonwood` owns the connected project `2ou0xy2r` / `production`; the real editor is hosted at https://cottonwood-community-library.sanity.studio/. Nine existing prototype records were published through native Studio, with 16 uploaded assets. The signed webhook, checked publisher and identity-only recovery review app are configured. Routine website saves follow the Codex PR preview/approval/merge workflow in WORKFLOW.md. Read the actual publisher/CMS workflow result before claiming a verified website update. The official Sanity plugin was connected in the library ChatGPT account on October 20, and actual reads, private event-draft creation, end-time correction and discard succeeded in Safari. Nonprofit approval, a backup administrator and full publishing/recovery acceptance remain handoff gates. No additional paid subscription is authorized.

With `LIBRARY_CONTENT_SOURCE=sanity`, published CMS records feed one validated snapshot per build through `src/content/repository.ts`. Studio forms live in `studio/`; signed publishing/review logic in `cms-publisher/`. Native CMS publication and verified website deployment are distinct. The flow is preview → live; the live website is https://cottonwood-library.pages.dev/ on the library Cloudflare account. The real domain is attached to it at launch. The repository provider is now Sanity; the local files below are migration/recovery inputs rather than the ordinary publishing interface. Its migration inputs are:
- Homepage heading, hours, programs: `src/content/seed.ts`.
- Stories/news/events: `src/content/editorial.ts` and `src/content/feeds.ts`.
- Giving: `src/content/support.ts`.
- Images: `src/content/images.ts`, `src/assets/`, and `public/`.

Source provenance is recorded in `assistant/source.json`. Only website source and referenced public-facing assets were copied; unrelated research, emails, and working files were excluded.

The library owns the GitHub repository, Cloudflare account and ChatGPT Plus account. ChatGPT display handle is @cottonwoodlibrary; GitHub remains librarycottonwood. Keep recovery access with the board. Current account/setup evidence is in assistant/setup-status.json.

## Analytics, communications, and fundraising

The assistant role includes answering questions about website traffic, recent post performance, and Givebutter fundraising, alongside website changes and everyday library support. A separate Google Analytics demo account/property has been created, with consent-gated website tracking. It measures new demo visits only. The library-owned ChatGPT Plus account now has the official Givebutter plugin connected and tested. That connection is not automatically available in every Codex environment. Website-visitor reports from the demo Google Analytics property are connected through the library report tool. Social account insights are not connected; social posting is planned through Buffer. A public post or campaign page does not establish access to private analytics. Check the current tools and permissions before answering from an account; use supplied exports when available. The content repository is not a source of live performance figures.
