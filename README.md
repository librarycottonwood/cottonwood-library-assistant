# Cottonwood Community Library website

The library's website (Astro, Sanity CMS, Cloudflare Pages) and the ChatGPT plugin that library staff use to update it.

- Live website: https://cottonwood-library.pages.dev/ (moves onto cottonwoodcommunitylibrary.com at launch)
- Content editor (Sanity Studio): https://cottonwood-community-library.sanity.studio/
- Agents start at [AGENTS.md](AGENTS.md). Handoff status: [assistant/HANDOVER.md](assistant/HANDOVER.md). Plan: [assistant/ROADMAP.md](assistant/ROADMAP.md).
- Staff ask the library's ChatGPT for changes; its instructions are the plugin skills in [plugins/cottonwood-library/](plugins/cottonwood-library/).

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
| `.claude/` | Claude Code settings, hooks, skills and routines, parked for a possible later move to Claude ([docs/staff-guide.md](docs/staff-guide.md), [docs/setup-checklist.md](docs/setup-checklist.md)). |

## Develop

Node 24 and pnpm 11.15.1 (pinned).

```sh
pnpm install
pnpm check            # design-system check, unit tests, astro check
pnpm build
bash scripts/cms-check.sh   # Studio, CMS and publisher checks, no accounts needed
```

CI (`.github/workflows/check.yml`) runs the full set, including every `scripts/*.test.mjs`. New pictures go through `pnpm image:prepare`.

Never deploy from a computer. Previews and the live site come only from the GitHub workflows on the library's Cloudflare account.
