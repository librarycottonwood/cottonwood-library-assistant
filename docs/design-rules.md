# Website design rules (current pages)

These rules cover the existing pages built on `src/styles/global.css` and `SiteLayout`. Pages rebuilt on the new design tokens (`src/design-system/`, `BaseLayout`) follow the tokens instead.

Short rules every page follows. The classes live in `src/styles/global.css` (`@layer components`). Calm, readable, one idea at a time.

## Widths
- **Text is never wider than ~70 characters.** `--measure` is 40rem (≈ 640px). Research basis: 50–75 characters per line (Baymard, Bringhurst); WCAG 1.4.8 says ≤ 80; GOV.UK keeps text in a two-thirds column.
- `.container-prose`: a centered text column for text-led pages (news posts, events & news, our story, newsletter, privacy).
- `.container` (1200px): only for things that need width: card grids, photos beside text, the hero, the map, the giving banner.
- `.measure`: caps a short line of text (a section intro) that sits directly above a wide grid it lines up with.
- **Consistent alignment:** a prose block on its own (FAQ, paragraphs, a list of posts) is a centered `.container-prose` column, never a narrow column stuck to the left of a wide container with empty space beside it. Left-aligned narrow text is only allowed when it lines up with wide content directly below it (a heading over a card grid) or sits inside a `.split`.
- Full-bleed only for section background colours (`.section-tint`) and hero imagery.
- Never squeeze text into a column under ~320px. Cards are at least ~280px wide.

## Layout
- Default is one column.
- `.split` (two columns) only for a photo or map beside short text: a heading, ≤ 4 lines, and one button. Never text beside text.
- A photo beside a boxed panel uses `.split-equal` + `.split-media`: both columns the same height and top-aligned; the photo fills its column (object-cover) and the panel centres its content. Buttons inside a panel are `self-start` (never stretched).
- Maps and photos keep a sensible shape (3:2 to 16:10, rounded 4px). No ultra-wide, short strips.
- `.card-grid`: at most 3 columns; 2 on tablets, 1 on phones.

## Hierarchy
- Each block is a heading, at most one supporting line, and an action.
- No eyebrow labels (small caps text above headings). At most one small label per block, and only when it carries real information (a date, a time).
- Page titles use `PageIntro`. Add a `description` only when it says something real (no filler taglines).
- Breadcrumbs: none on top-level pages (Visit, Events & news, Kids, Our story, Support, Privacy); the main navigation shows where you are. Subpages pass `back` and get "Home / Parent / This page", the last item unlinked with `aria-current="page"`.
- Lists of events, programs and posts show a small square thumbnail (`.thumb`, ~104px desktop, ~72px phone) beside the text, never a banner. An event without its own (optional) CMS picture uses its program's picture, then the library photo.
- Events & news is a day-grouped agenda (`EventAgenda`). The visitor's browser hides occurrences after their end time and labels Today / Tomorrow / This week.

## Spacing
- Scale: 4 / 8 / 16 / 24 / 32 / 48 / 80 / 112px.
- `.section` = 80px top and bottom on phones, 112px from tablet up. A 1440×900 screen should show at most ~1.5 sections.
- One idea per section. Use `.section pt-0` straight after `PageIntro`.

## Cards
- One card style: `.card` > `.card-media` + `.card-body` (24–28px padding on every side) > `.card-title`, `.card-text`, `.card-action`. Use `InfoCard` (photo, title, one line, link) for content cards and `FeatureCard` when the whole card is a link.
- No full-width coloured button tiles for content links; use cards. Two cards stay in the 3-column grid (they don't stretch).
- Content flows from the top. When cards in a row need equal heights, the action sits at the bottom with `.card-action` (`mt-auto`); never leave empty space under the text.
- `.panel` (meadow background, same padding) for hours, "When/Where" and step lists.

## Content and photos
- **Where content lives (Jaden, Nov 2026; replaces the old "never hard-code library facts" rule).**
  - **Sanity** holds only content that changes often: events, news posts, newsletters, notices/banners, opening hours, fundraisers, and site-wide settings (address, phone, email, links). Hours always come from Sanity.
  - **The page file** (`src/pages/…`) holds everything else: service descriptions, printing prices, late fees, renewal rules, computer and Wi-Fi help, About Us text, Support Us "Other ways to help", and the photos that belong to the page design. Write it with the Figma wording. Volunteers change it by asking for a pull request.
  - Do **not** add new Sanity fields or document types for page content. Things already in Sanity (programs, services, borrowing questions, the story, giving texts) stay there until someone decides to move them.
  - Still never invent facts: page content comes from Figma or from library staff, and anything copied from Figma that staff haven't confirmed (prices, fees, rules) is listed for them to check.
- Page photos live in `src/assets/images/`, are registered in `src/content/images.ts`, and are prepared with `pnpm image:prepare`.

## Motion

Motion makes the site feel calm and responsive; it never decorates, loops or makes anyone wait.

- **Entrances use Motion** (the `motion` package, docs at https://motion.dev) through one file, `src/scripts/motion.ts`. Components opt in with `data-motion`: `rise` (one block fades up as it scrolls into view: cards, photos), `group` (each child rises a beat apart: Section content, Split text, page titles) or `settle` (a photo eases out of a slight zoom inside its frame: the homepage's opening photo). Section, Split, Card and PageTitle already do this, so a new page built from them animates with no extra work.
- **A new component** gets motion by adding one of those attributes to its root.
- **New kinds of animation are welcome** when the library asks (a slide in from the side, a pop, a counter ticking up). Add each one as a named preset in `motion.ts` with Motion (look up its docs at motion.dev), add the name to `scripts/motion.test.mjs`, and use it through `data-motion`. Keep it in that one file, never `animate()` or entrance `@keyframes` inside a component and never a second animation library, so every animation shares the same feel and the reduced-motion and no-JavaScript safety.
- **Hover and press feedback is CSS** with the `--motion-*` tokens: colors fade, the button presses in, arrows nudge, card photos zoom slightly. Only on devices that hover.
- **Opening and closing** (FAQ answers) uses `slide()` from `motion.ts`, so both directions animate.
- **Always:** springs without bounce; zoom a photo only inside a frame that owns its rounded corners and border, as Card and Split's opening photo do (a photo with its own rounded corners gets them cut square while it zooms); nothing over about a second; never animate a block holding a Givebutter widget (its popups would get trapped under the header); everything still works and shows with JavaScript off or reduced motion on (base.css hides blocks only under `html.motion`).

## Keep
- Colours, Lora + DM Sans, the hero, focus outlines, skip link, real alt text, heading order (one h1 per page). Check every change at 375px wide.
