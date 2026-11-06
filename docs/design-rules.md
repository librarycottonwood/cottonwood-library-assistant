# Website design rules

Rules that sit above the components. The tokens and components themselves are in [`docs/design-system.md`](design-system.md) (generated); pages only compose `src/components/site/`. Calm, readable, one idea at a time.

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
- **Opening and closing** uses `motion.ts` so both directions animate: FAQ answers use `slide()`, the full-screen phone menu uses `menu()` (the panel fades, its links rise a beat apart).
- **Always:** animate only `opacity` and a full `transform` string with explicit start and end values (`['translateY(24px)', 'translateY(0px)']`, never `'none'`), which the browser runs smoothly off the main thread; never Motion's `x`, `y` or `scale` shorthands, which are computed in JavaScript each frame and stutter while a page loads; springs without bounce; zoom a photo only inside a frame that owns its rounded corners and border, as Card and Split's opening photo do (a photo with its own rounded corners gets them cut square while it zooms); nothing over about a second; never animate a block holding a Givebutter widget (its popups would get trapped under the header); everything still works and shows with JavaScript off or reduced motion on (base.css hides blocks only under `html.motion`).

## Keep
- Colours, Bree Serif + Mona Sans, the hero, focus outlines, skip link, real alt text, heading order (one h1 per page). Check every change at 375px wide.
