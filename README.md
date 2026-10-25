# Cottonwood Community Library website

The library's website (Astro, Sanity CMS, Cloudflare Pages) and the Claude Code setup that library staff use to update it.

- Live website: https://cottonwood-library.pages.dev/
- Content editor (Sanity Studio): https://cottonwood-community-library.sanity.studio/
- Staff guide: [docs/staff-guide.md](docs/staff-guide.md)
- Claude rules: [CLAUDE.md](CLAUDE.md) and [.claude/](.claude/)

## Layout

| Path | What it is |
| --- | --- |
| `src/` | The website. Pages, components, content adapters, design tokens (`src/design-system/`), pictures (`src/assets/`). |
| `public/` | Files served as-is (favicons, PDFs, robots.txt). |
| `studio/` | Sanity Studio (the content editor's forms and schemas). |
| `cms-publisher/` | Cloudflare Worker for Sanity webhooks, the publishing ledger and the admin recovery page. |
| `connector/` | Cloudflare Worker: visitor-report MCP connector (ChatGPT era, see its README). |
| `scripts/` | Build, CMS, image, release and publishing scripts plus their tests. |
| `content-updates/latest.json` | Changed by content-only PRs so the website gets a reviewable preview. |
| `.github/workflows/` | Checks, previews, live publishing and monitoring. The only way anything is deployed. |
| `.claude/` | Claude Code settings, safety hooks, staff skills and scheduled-task (routine) prompts. |
| `docs/` | Staff guide, setup checklist, design rules, domain launch plan. |

## Develop

Node 24 and pnpm 11.15.1 (pinned).

```sh
pnpm install
pnpm check
pnpm build
node --test scripts/release.test.mjs scripts/publish-live.test.mjs scripts/images.test.mjs scripts/library-account.test.mjs
node scripts/analytics.test.mjs
node --test .claude/hooks/guard.test.mjs   # Claude safety hook
bash scripts/cms-check.sh   # Studio, CMS and publisher checks, no accounts needed
```

Never deploy from a computer. Previews and the live site come only from the GitHub workflows on the library's Cloudflare account.
