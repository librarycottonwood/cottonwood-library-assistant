# New website design system

Pages built on `BaseLayout` use only the tokens and components described here.
The agent-readable reference is [`docs/design-system.md`](../../docs/design-system.md);
it is generated, so edit the sources below and run `pnpm design:docs`.

| Source | What it holds |
| --- | --- |
| `tokens.ts` | Every token with its value and usage notes (`useFor`, `avoid`, `example`). Generates `/components/tokens.css`, the `/components` catalog and the token half of the reference. |
| `src/components/site/*.astro`, `src/layouts/BaseLayout.astro` | Components. The `/** @component … */` block at the top of each file is its usage note (purpose, `@use`, `@avoid`, `@example`); `component-docs.ts` reads it for the catalog and the reference. |
| `src/styles/base.css` | Element defaults, fluid type sizes (`--fluid-*`), and the `data-gap` rules behind every `gap` prop. |

## Spacing

Five steps: `--space-xs` 10px, `--space-sm` 20px, `--space-md` 30px, `--space-lg` 60px,
`--space-xl` 100px (rems on a 16px root). There are no padding or gap tokens:
components own their padding and gaps, and layout props (`gap`) accept only
`xs | sm | md | lg | xl` (the `Space` type in `tokens.ts`).

Responsive spacing does not use fluid values. `--page-inset`, `--section-space` and
`--section-gap` step between the five values at fixed breakpoints, and
`--width-content` (1520px) reproduces the design's 200px side margins at 1920px.
Type sizes stay fluid.

`pnpm check` runs `scripts/design-system.mjs check`, which fails when the reference
is stale, when a component lacks a usage block, or when a new-system file uses raw
px/rem/em (or clamp/calc) spacing, a spacing token outside the five steps, a deleted
token, Tailwind spacing classes, or (in pages) any spacing declaration at all.
Every page is on this system; the old `SiteLayout` and `global.css` are gone.

## Source

Values come from the [Cottonwood Figma redesign](https://www.figma.com/design/ZHygohymNhKRQyxIhQsQ2P/Untitled?node-id=1001-2),
inspected October 21, 2026. The homepage follows the five-step scale rather than
matching every Figma measurement (approved by Jaden). SF Pro appears in Figma only as
icon glyphs and is not a web font; icons come from Lucide via `Icon.astro`.

The `/components` catalog uses its own plain stylesheet (`catalog.css`). It is
`noindex` and disallowed in `robots.txt`.
