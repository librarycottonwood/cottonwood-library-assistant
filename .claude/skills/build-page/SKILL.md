---
name: build-page
description: Build or rebuild a website page on the new design (BaseLayout), or change the layout of one. Use when someone asks for a new page, wants an old page moved to the new design, or wants sections added, removed or rearranged on a new-design page. Not for content edits (events, news, notices, hours), which go through Sanity.
---

# Build a page

New pages use only the design system's components and tokens. That keeps every page consistent without anyone measuring pixels.

## Before you write code

1. Read `docs/design-system.md` in full. It lists every token and component, with what each is for and not for, and an example.
2. Look at `src/pages/index.astro`. It is the reference page: built only from components, with no `<style>` block.
3. Ask the person what the page is for and what should be on it, one question at a time. Words, events and photos come from Sanity (`contentRepository`); if the content isn't in Sanity yet, use the matching staff skill first. Never invent facts.

## Build

- Branch `claude/<short-name>` from fresh `origin/main`.
- Wrap the page in `BaseLayout` (from `src/layouts/BaseLayout.astro`). Put `Split` and `Section` directly inside it; use `Stack`, `Grid`, `Card`, `Button`, `Badge`, `Heading`, `Text`, `IconLink` and `EventCards` inside those.
- Don't write margin, padding, gap or inset anywhere in the page. To change space between things, use a component's `gap` prop: `xs`, `sm`, `md`, `lg` or `xl`.
- Don't add colors, sizes or fonts. Pick tokens by their "Use for" note.
- If nothing fits, add one small component to `src/components/site/` with a usage block at the top (copy the format from an existing one), use only the spacing tokens inside it, then run `pnpm design:docs`. Tell the person you added it.
- Leave old pages (those using `SiteLayout`) alone unless the task is to move that page to the new design.

## Check

1. `pnpm check` (this includes the design-system check; it names the file and line of any problem and what to use instead) and `pnpm build`.
2. Screenshot the page at 1920, 1280 and 390px wide (Playwright is installed; `scripts/browser.mjs` launches it). Make sure nothing scrolls sideways, nothing overlaps, and it looks like the homepage's style.
3. Save it with the `website-save` skill (pull request, preview, "Ready to save?").
