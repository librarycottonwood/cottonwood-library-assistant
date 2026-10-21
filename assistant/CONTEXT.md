# Library context

Cottonwood Community Library serves Cottonwood, California. Timezone: America/Los_Angeles.
This repository holds the custom library website and conversational upkeep pilot. Jaden reports the board accepted the pivot from Squarespace at the October 6 meeting and wants a six-week trial of preview edits and connected reports. The existing public website is unchanged; launch and publishing are separate. Library copy still needs board review before launch.

The website is static Astro with Node 24 and pnpm 11.15.1. No payment collection or form backend is configured here. Cloudflare Pages can host the static output; additional Pages Functions can be added when an actual request needs them.

Content management is being moved to Sanity; read `assistant/CMS.md` before editing. PR #22 is merged. The library-owned GitHub identity `librarycottonwood` owns the connected project `2ou0xy2r` / `production`; the real editor is hosted at https://cottonwood-community-library.sanity.studio/. Nine existing trial records were published through native Studio, with 16 uploaded assets. The signed webhook, checked publisher and identity-only review app are configured. Read the actual publisher/CMS workflow result before claiming a verified website update. Nonprofit approval, backup administrator, ChatGPT connection and complete recovery rehearsal remain handoff gates. No additional paid subscription is authorized.

With `LIBRARY_CONTENT_SOURCE=sanity`, published CMS records feed one validated snapshot per build through `src/content/repository.ts`. Studio forms live in `studio/`; signed publishing/review logic in `cms-publisher/`. Native CMS publication and verified website deployment are distinct. The single saved trial is https://cms-trial.cottonwood-library-trial-preview.pages.dev/ . The old demo publishing path is retired and its address redirects to the CMS trial; the real domain remains separate. The repository provider is now Sanity; the local files below are migration/recovery inputs rather than the ordinary publishing interface. Its migration inputs are:
- Homepage heading, hours, programs: `src/content/seed.ts`.
- Stories/news/events: `src/content/editorial.ts` and `src/content/feeds.ts`.
- Giving: `src/content/support.ts`.
- Images: `src/content/images.ts`, `library-files/`, and `public/`.

Source provenance is recorded in `assistant/source.json`. Only website source and referenced public-facing assets were copied; unrelated research, emails, and working files were excluded.

The library owns the GitHub repository, Cloudflare account and ChatGPT Plus account. ChatGPT display handle is @cottonwoodlibrary; GitHub remains librarycottonwood. Keep recovery access with the board. Current account/setup evidence is in assistant/setup-status.json.

## Analytics, communications, and fundraising

The assistant role includes answering questions about website traffic, recent post performance, and Givebutter fundraising, alongside website changes and everyday library support. A separate Google Analytics demo account/property has been created, with consent-gated website tracking. It measures new demo visits only. The library-owned ChatGPT Plus account now has the official Givebutter plugin connected and tested. That connection is not automatically available in every Codex environment. Website-visitor reports from the demo Google Analytics property are connected through the library report tool. Social account insights are not connected; social posting is planned through Buffer. A public post or campaign page does not establish access to private analytics. Check the current tools and permissions before answering from an account; use supplied exports when available. The content repository is not a source of live performance figures.
