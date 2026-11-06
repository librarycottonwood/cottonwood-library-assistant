# Cottonwood Community Library website

[![Verify library website](https://github.com/librarycottonwood/cottonwood-library-assistant/actions/workflows/check.yml/badge.svg)](https://github.com/librarycottonwood/cottonwood-library-assistant/actions/workflows/check.yml)
[![License: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](LICENSE)

The website of the [Cottonwood Community Library](https://cottonwood-library.pages.dev/), a community-supported library in Cottonwood, California, and the AI assistant its staff and volunteers use to keep the site up to date.

Staff and volunteers don't edit code or sign in to any developer tools. They ask the library's ChatGPT for a change ("add the book sale on Saturday", "we're closed for Thanksgiving"). The assistant drafts it, shows a preview, asks "Ready to save?" and publishes it after a yes. Every change is a reviewed pull request and can be undone.

- Live website: https://cottonwood-library.pages.dev/ (moves to cottonwoodcommunitylibrary.com at launch)
- Content editor (Sanity Studio): https://cottonwood-community-library.sanity.studio/

## How it works

| Piece | Built with |
| --- | --- |
| Website | [Astro](https://astro.build/), static pages on Cloudflare Pages |
| Events, news, newsletters, notices, hours | [Sanity](https://www.sanity.io/) CMS |
| Assistant | A ChatGPT plugin: one skill per kind of request, in [`plugins/cottonwood-library/`](plugins/cottonwood-library/) |
| Publishing | GitHub Actions only: checks, a preview for every pull request, then the checked build is promoted live without rebuilding |
| Donations and newsletter email | Givebutter |
| Visitor reports | Google Analytics, through a small Cloudflare Worker connector |

The flow for every change is **preview → "Ready to save?" → live**, and the previous live build is kept for rollback. Details: [assistant/WORKFLOW.md](assistant/WORKFLOW.md).

## Layout

| Path | What it is |
| --- | --- |
| `src/` | The website: pages, site components (`src/components/site/`), design tokens (`src/design-system/`), content adapters, motion (`src/scripts/motion.ts`), pictures (`src/assets/`). |
| `public/` | Files served as-is (favicons, PDFs, robots.txt). |
| `functions/` | Cloudflare Pages Function behind the newsletter sign-up form (`/api/newsletter`). |
| `studio/` | Sanity Studio (the content editor's forms and schemas). |
| `cms-publisher/` | Cloudflare Worker for Sanity webhooks, the publishing ledger and the admin recovery page. |
| `connector/` | Cloudflare Worker: the visitor-report connector the library's ChatGPT uses. |
| `plugins/cottonwood-library/` | The ChatGPT plugin: one skill per kind of request (events, news, newsletter, publishing…). |
| `assistant/` | Instructions and records for the assistant: workflow, CMS, maintenance, handoff, roadmap, setup status. |
| `docs/` | Design rules, the generated design-system reference, library facts, photography, staff and setup guides. |
| `scripts/` | Build, CMS, image, release and publishing scripts plus their tests. |
| `content-updates/` | One small file per content-only save (`YYYY-MM-DD-name.json`), so each save gets a reviewable preview and can be undone. |
| `.github/workflows/` | Checks, previews, live publishing, repair and monitoring. The only way anything is deployed. |

Agents start at [AGENTS.md](AGENTS.md). Handoff status: [assistant/HANDOVER.md](assistant/HANDOVER.md). Plan: [assistant/ROADMAP.md](assistant/ROADMAP.md).

## Develop

Node 24 and pnpm 11.15.1 (pinned).

```sh
pnpm install
pnpm dev              # local site at http://localhost:4321 (sample content, no accounts needed)
pnpm check            # design-system check, unit tests, astro check
pnpm build
bash scripts/cms-check.sh   # Studio, CMS and publisher checks, no accounts needed
```

CI (`.github/workflows/check.yml`) runs the full set, including every `scripts/*.test.mjs`. New pictures go through `pnpm image:prepare`.

Never deploy from a computer. Previews and the live site come only from the GitHub workflows on the library's Cloudflare account.

## Contributing and security

Outside pull requests aren't accepted; see [CONTRIBUTING.md](CONTRIBUTING.md). To report a security problem, see [SECURITY.md](SECURITY.md).

## License

The code is under the [MIT License](LICENSE). The library's name, logo, photographs, sponsor logos and written content (pages, posts, newsletters) are not covered by it and belong to the library or their owners.
