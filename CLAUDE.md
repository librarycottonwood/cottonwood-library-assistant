# Cottonwood Community Library: rules for Claude

This repo is the website of Cottonwood Community Library, a small volunteer-run nonprofit library in Cottonwood, California. Time zone: America/Los_Angeles. Live site: https://cottonwood-library.pages.dev/

## Who you are talking to

Usually a library staff member or board volunteer, not a developer. Jaden (the original developer) leaves in December 2026.

- Be friendly and brief. Plain words. No commands, file names, test counts or tool names in replies unless asked.
- Ask one question at a time, and only for facts you can't find. Don't restart a wizard for a small correction.
- Write the copy yourself from their facts. Never invent dates, times, prices, names, amounts, quotes or policies; ask.
- Never ask for passwords, codes or keys. If a person must act, give one clear step with its link, then wait.
- Don't end a reply promising to do something later. Do it, or say exactly what stopped you.
- If you get blocked by a safety check, explain it in one plain sentence. Don't look for a way around it.

## Hard rules (enforced by `.claude/hooks/guard.mjs` and `.claude/settings.json`)

1. Nothing goes to `main` directly. Every website change: branch → pull request → preview → the person says yes to "Ready to save?" → merge. Merging is what saves to the live site; it always needs a person to approve the permission prompt.
2. No force-pushes. Never delete `main` or `maintenance-reports` (the daily checks write their results to `maintenance-reports`).
3. Never deploy from a session. No `wrangler`, no Cloudflare API, no deploy scripts. Previews and the live site come only from the GitHub workflows on the library's Cloudflare account.
4. Never read or print secrets (`.env*` except `.env.example`, `.dev.vars`, tokens). Keep donor and private details out of public content, PRs and issues.
5. Sanity: edit content only. No schema, Studio, dataset, CORS, token or project changes.
6. Accounts, billing, domains, DNS, permissions and GitHub settings are for the board, not Claude.

## Where things live

| Thing | Where |
| --- | --- |
| Words, events, news, notices, newsletters, hours, programs, fundraisers, photos | Sanity CMS: project `2ou0xy2r`, dataset `production`, via the Sanity connector. Editor: https://cottonwood-community-library.sanity.studio/ |
| Field definitions | `studio/README.md` (Document contract) and `studio/schemas/` |
| Layout, design, code | `src/`. New design tokens: `src/design-system/tokens.ts`, `BaseLayout.astro`. Old pages: `SiteLayout.astro` + `docs/design-rules.md` |
| Building new-design pages (tokens + components, with use/don't-use notes) | `docs/design-system.md` (generated; read it first, or use the `build-page` skill) |
| Library facts (donation campaign, newsletter, social, contacts) | `docs/library-facts.md` |
| Publishing pipeline | `.github/workflows/check.yml` (checks + PR preview build) and `publish-live.yml` (preview upload, then live publish after merge) |
| Staff wizards | `.claude/skills/` |
| Scheduled checks | `.claude/routines/` |

Content edits never go in `src/content/seed.ts`, `editorial.ts`, `support.ts` etc. Those are old migration inputs.

## Saving a change

Use the `website-save` skill for every save. In short:
- **Content change**: draft in Sanity → show the person → publish the Sanity record → PR that updates `content-updates/latest.json` → wait for the **Website preview** status → check it → "Ready to save?" → merge → wait for **Live website** → check the live page.
- **Code or design change**: branch `claude/<short-name>` from fresh `origin/main` → edit → `pnpm check`, `pnpm build`, affected tests → PR → same preview / approval / merge / live check.

## Working in this repo

- Node 24, pnpm 11.15.1 (pinned). In cloud sessions the SessionStart hook sets this up.
- GitHub in cloud sessions: use `gh api repos/librarycottonwood/cottonwood-library-assistant/...` (REST). `gh pr` and `gh issue` don't work there.
- Branch names: `claude/<short-name>`. Commit messages: conventional (`feat:`, `fix:`, `content:`, `chore:`).
- New pictures in the site code: `pnpm image:prepare -- <file> --name <name>` (strips location data, resizes). Photos for posts and events go to Sanity instead (see `website-save` skill).
- Checks for code changes: `pnpm check`, `pnpm build`, `node --test scripts/release.test.mjs scripts/publish-live.test.mjs scripts/images.test.mjs scripts/library-account.test.mjs`, and `node --test .claude/hooks/guard.test.mjs` if you touched `.claude/`.
- Don't edit workflows, tests, `scripts/publish-live.mjs`, `scripts/cms-publishing.mjs`, `cms-publisher/` or `connector/` unless Jaden or a board admin asked for that specific change.
