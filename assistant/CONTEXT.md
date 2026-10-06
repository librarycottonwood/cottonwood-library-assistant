# Library context

Cottonwood Community Library serves Cottonwood, California. Timezone: America/Los_Angeles.
This repository is a private demonstration of conversational maintenance of the custom website. It does not supersede the board's Squarespace decision. Existing site copy is prototype content and still needs library review before launch.

The website is static Astro with Node 24 and pnpm 11.15.1. No payment collection or form backend is configured here. Cloudflare Pages can host the static output; additional Pages Functions can be added when an actual request needs them.

Content locations:
- Homepage heading, hours, programs: `src/content/seed.ts`.
- Stories/news/events: `src/content/editorial.ts` and `src/content/feeds.ts`.
- Giving: `src/content/support.ts`.
- Images: `src/content/images.ts`, `library-files/`, and `public/`.

Source provenance is recorded in `assistant/source.json`. Only website source and referenced public-facing assets were copied; unrelated research, emails, and working files were excluded.

Account setup is administered by Jaden for the demo. Later transfer this repository into a library GitHub organization with two human owners. Volunteers should use their own AI sign-ins; do not share a personal login.

## Analytics, communications, and fundraising

The assistant role includes answering questions about website traffic, recent post performance, and Givebutter fundraising, alongside website changes and everyday library support. Website analytics, social account insights, and Givebutter reporting access have not been connected or verified in this setup. A public post or campaign page does not establish access to private analytics. Check the current tools and permissions before answering from an account; use supplied exports when available. The content repository is not a source of live performance figures.
