# Website design rules

Short rules every page follows. The classes live in `src/styles/global.css` (`@layer components`). Calm, readable, one idea at a time.

## Widths
- **Text is never wider than ~70 characters.** `--measure` is 40rem (≈ 640px). Research basis: 50–75 characters per line (Baymard, Bringhurst); WCAG 1.4.8 says ≤ 80; GOV.UK keeps text in a two-thirds column.
- `.container-prose`: a centered text column for text-led pages (news posts, events & news, our story, newsletter, privacy).
- `.container` (1200px): only for things that need width: card grids, photos beside text, the hero, the map, the giving banner.
- `.measure`: caps text inside a wide container (section intros, FAQs, forms). Keeps one left edge on the page.
- Full-bleed only for section background colours (`.section-tint`) and hero imagery.
- Never squeeze text into a column under ~320px. Cards are at least ~280px wide.

## Layout
- Default is one column.
- `.split` (two columns) only for a photo or map beside short text: a heading, ≤ 4 lines, and one button. Never text beside text.
- `.card-grid`: at most 3 columns; 2 on tablets, 1 on phones.

## Hierarchy
- Each block is a heading, at most one supporting line, and an action.
- No eyebrow labels (small caps text above headings). At most one small label per block, and only when it carries real information (a date, a time).
- Page titles use `PageIntro` (title + optional one-line `description`, optional `meta` like a post date).

## Spacing
- Scale: 4 / 8 / 16 / 24 / 32 / 48 / 80 / 112px.
- `.section` = 80px top and bottom on phones, 112px from tablet up. A 1440×900 screen should show at most ~1.5 sections.
- One idea per section. Use `.section pt-0` straight after `PageIntro`.

## Cards
- One card style: `.card` > `.card-media` + `.card-body` (24–28px padding on every side) > `.card-title`, `.card-text`, `.card-action`.
- Content flows from the top. When cards in a row need equal heights, the action sits at the bottom with `.card-action` (`mt-auto`); never leave empty space under the text.
- `.panel` (meadow background, same padding) for hours, "When/Where" and step lists.

## Keep
- Colours, Lora + DM Sans, the hero, focus outlines, skip link, real alt text, heading order (one h1 per page). Check every change at 375px wide.
