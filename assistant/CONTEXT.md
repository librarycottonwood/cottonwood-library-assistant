# Library context

Cottonwood Community Library serves Cottonwood, California. Timezone: America/Los_Angeles.
This repository holds the library's website and the instructions the library's ChatGPT assistant follows to keep it up to date. Staff ask for changes in plain words; every change gets a preview and is saved only after someone says it's ready. The website is live at https://www.cottonwoodcommunitylibrary.com/ (launched November 5, 2026; the same deployment also answers at https://cottonwood-library.pages.dev/).

The website is static Astro with Node 24 and pnpm 11.15.1. Cloudflare Pages hosts the static output plus one Pages Function: the newsletter sign-up form posts to `/api/newsletter` (`functions/api/newsletter.ts`), which adds a Givebutter contact. Donations go through Givebutter checkout and widgets; the website itself stores no payments or donor data.

Content management uses Sanity; read `assistant/CMS.md` before editing. The library owns project `2ou0xy2r` / `production`; the editor is hosted at https://cottonwood-community-library.sanity.studio/. The signed webhook, checked publisher and identity-only recovery review app are configured. Routine website saves follow the PR preview/approval/merge workflow in WORKFLOW.md. Read the actual publisher/CMS workflow result before claiming a verified website update. No additional paid subscription is authorized.

With `LIBRARY_CONTENT_SOURCE=sanity`, published CMS records feed one validated snapshot per build through `src/content/repository.ts`. Studio forms live in `studio/`; signed publishing/review logic in `cms-publisher/`. Native CMS publication and verified website deployment are distinct. The local files below are fixture/recovery inputs rather than the ordinary publishing interface:
- Homepage heading, hours, programs: `src/content/seed.ts`.
- Stories/news/events: `src/content/editorial.ts` and `src/content/feeds.ts`.
- Giving: `src/content/support.ts`.
- Images: `src/content/images.ts`, `src/assets/`, and `public/`.

The library owns the GitHub repository, Cloudflare account and ChatGPT account. Keep recovery access with the board. Current setup is summarized in `assistant/setup-status.json`; account owners, sign-ins and recovery are in the private account directory in the library ChatGPT Maintenance project (Sources), never in this public repository.

## Analytics, communications, and fundraising

The assistant role includes answering questions about website traffic, recent post performance, and Givebutter fundraising, alongside website changes and everyday library support. The library's Google Analytics property ("Cottonwood Community Library website", `src/content/analytics.json`) has consent-gated tracking and counts visits to the new site only. The library ChatGPT account has the official Givebutter plugin connected (read-only). That connection is not automatically available in every Codex environment. Website-visitor reports come from that property through the library report tool (`connector/`). Social account insights are not connected; social posts go through Buffer as drafts. A public post or campaign page does not establish access to private analytics. Check the current tools and permissions before answering from an account; use supplied exports when available. The content repository is not a source of live performance figures.
