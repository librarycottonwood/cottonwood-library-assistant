# Website design rules

Rules that sit above the components. The tokens and components themselves are in [`docs/design-system.md`](design-system.md) (generated); pages only compose `src/components/site/`. Calm, readable, one idea at a time.

## Content and photos
- **Where content lives (Jaden, Nov 2026; replaces the old "never hard-code library facts" rule).**
  - **Sanity** holds only content that changes often: events, news posts, newsletters, notices/banners, opening hours, fundraisers, and site-wide settings (address, phone, email, links). Hours always come from Sanity.
  - **The page file** (`src/pages/…`) holds everything else: service descriptions, printing prices, late fees, renewal rules, computer and Wi-Fi help, About Us text, Support Us "Other ways to help", and the photos that belong to the page design. Write it with the Figma wording. Volunteers change it by asking for a pull request.
  - Do **not** add new Sanity fields or document types for page content. Things already in Sanity (programs, services, borrowing questions, the story, giving texts) stay there until someone decides to move them.
  - Still never invent facts: page content comes from Figma or from library staff, and anything copied from Figma that staff haven't confirmed (prices, fees, rules) is listed for them to check.
- Page photos live in `src/assets/images/`, are registered in `src/content/images.ts`, and are prepared with `pnpm image:prepare`.

## Search and sharing

Checklist for every new page (and when a page's purpose changes):

- [ ] `title`: unique, `"<Page> | Cottonwood Community Library"` (BaseLayout requires it; `pnpm check` fails without one).
- [ ] `description`: 1–2 plain sentences from facts on the page itself, different from every other page. This is the line under the title in Google and on Facebook/text previews.
- [ ] `image`: the page's own landscape photo, so its share card isn't the homepage photo. Without one, the homepage photo is used.
- [ ] No invented facts, numbers, dates or quotes in either. Ask library staff for anything missing.
- [ ] Dated things on the page (events, sessions) get schema.org data through `schema` (helpers in `src/content/seo.mjs`); don't hand-write JSON-LD.
- [ ] A new top-level page: add one line for it under "Main pages" in `src/pages/llms.txt.ts` (the summary AI assistants read).

Automatic, nothing to add: the canonical address, Open Graph/share-card tags, the library's schema.org data, the sitemap entry (`astro.config.mjs`), and `llms.txt` lines for programs, events and news posts. Pass `noindex` only for pages that shouldn't appear in Google (the "page not found" page). `pnpm build` fails if a public page has no title, description or canonical address, and warns about two pages sharing a title or description.

## Motion

Motion makes the site feel calm and responsive; it never decorates, loops or makes anyone wait.

- **Entrances use Motion** (the `motion` package, docs at https://motion.dev) through one file, `src/scripts/motion.ts`. Components opt in with `data-motion`: `rise` (one block fades up as it scrolls into view: cards, photos), `group` (each child rises a beat apart: Section content, Split text, page titles) or `settle` (a photo eases out of a slight zoom inside its frame: the homepage's opening photo). Section, Split, Card and PageTitle already do this, so a new page built from them animates with no extra work.
- **A new component** gets motion by adding one of those attributes to its root.
- **New kinds of animation are welcome** when the library asks (a slide in from the side, a pop, a counter ticking up). Add each one as a named preset in `motion.ts` with Motion (look up its docs at motion.dev), add the name to `scripts/motion.test.mjs`, and use it through `data-motion`. Keep it in that one file, never `animate()` or entrance `@keyframes` inside a component and never a second animation library, so every animation shares the same feel and the reduced-motion and no-JavaScript safety.
- **Hover and press feedback is CSS** with the `--motion-*` tokens: colors fade, the button presses in, arrows nudge, card photos zoom slightly. Only on devices that hover.
- **Opening and closing** uses `motion.ts` so both directions animate: FAQ answers use `slide()`, the full-screen phone menu uses `menu()` (the panel fades, its links rise a beat apart).
- **Always:** animate only `opacity` and a full `transform` string with explicit start and end values (`['translateY(24px)', 'translateY(0px)']`, never `'none'`), which the browser runs smoothly off the main thread; never Motion's `x`, `y` or `scale` shorthands, which are computed in JavaScript each frame and stutter while a page loads; springs without bounce; zoom a photo only inside a frame that owns its rounded corners and border, as Card and Split's opening photo do (a photo with its own rounded corners gets them cut square while it zooms); nothing over about a second; never animate a block holding a Givebutter widget (its popups would get trapped under the header). Prepare entrance states before paint and hold them through the animation handoff, so content never flashes visible before fading in. Each group enters as one sequence, including its actions. If initialization misses the short loading window, reveal content and skip late entrances. Direct viewport checks back up observers, and bounded cleanup clears stalled animations. Everything still works and shows with JavaScript off or reduced motion on.

- **Keyboard focus:** reveal a waiting entrance group immediately when it receives focus, and finish any active entrance on that group, so Tab never lands on invisible controls.

## Keep
- Colours, Bree Serif + Mona Sans, the hero, focus outlines, skip link, real alt text, heading order (one h1 per page). Check every change at 375px wide.

## Reading layouts

The shared reading components use Mona Sans for headings and regular-weight 18px body text. Layouts may choose the white page surface (`data-surface="white"`); headers and menus inherit it. The academy places branding and search at the top of its desktop sidebar, with a centered SearchDialog. Its compact phone header uses the shared HeaderMenu and MenuToggle; phone search lives at the top of that menu. Secondary library and print links belong in academy navigation. Topic cards, examples, service panels and Previous/Next cards share the quiet neutral Surface component, including its padding, corners and link hover. Previous/Next places the direction above a left-aligned lesson title. Keep these choices in shared components and tokens, not an academy-only stylesheet. Bree Serif remains the public site's display face.

## Illustration, handwriting and leaf dividers

Decoration follows the section's purpose, not how empty it looks. Plain headings are the default. Do not decorate every section or rotate treatments merely to create variety.

| Section role | Treatment | Current examples |
| --- | --- | --- |
| Main page topic or major invitation | A matching crayon scene. On phones, center the artwork above the heading; illustrated invitations also center their copy and actions. | Reading for Events & News, computers for Services, community for the homepage support invitation, volunteers for Volunteer at the library. |
| A personal promise, invitation or sign-off | One short indigo Caveat phrase, at most once per page. Use it in the personal invitation, not practical subsection labels. | Home: “library.”; Support Us: “Volunteer”; About: “Thank you for your support!” |
| Library history or community gratitude | A centered botanical immediately above a regular Bree Serif heading. | About: branch above “A place of our own”; Support Us: flower above “Thank you to our supporters”. |
| Browsing, instructions or facts | Regular Bree Serif headings and Mona Sans copy. No added handwriting or botanical. | Upcoming and Regular Events, Latest News, individual services, FAQs, Other ways to help, dates, prices and forms. |

- Bree Serif and Mona Sans remain the main type pair. Use self-hosted Caveat through `Handwritten` or `AccentHeading`; keep it real, selectable text. A page without a personal message does not need handwriting. “Powered by Community” stays plain so it does not repeat the homepage hero's handwritten emphasis.
- `AccentHeading` receives the complete existing heading and an exact phrase. If the phrase is absent, it renders the complete heading plainly. Never rewrite CMS wording to make decoration work.
- Illustrations identify the subject of a main page or invitation. They are not repeated beside each service, event or card title. Index pages may have topic artwork even when their practical subsection headings stay plain. Article, event-detail and legal page titles stay plain.
- The reading scene in the shared footer is the site's repeated closing illustration, in the same place on every page. It is separate from section heading decoration.
- A botanical is a pause for a story or thank-you, not a general section marker. Use at most one per page, centered above the heading with the same small gap, and never on a heading that already has handwriting or a crayon scene. `branch` is the standard story accent; `pair` is the flower for gratitude. The upright `sprig` remains an available drawing, not a requirement to find another place to decorate.
- The volunteer invitation and homepage community invitation share the same illustration-above-heading layout. They center on phones; desktop retains the real photo on the left and copy on the right. A volunteer invitation may pair its subject drawing with the page's one handwritten phrase. Do not add a third accent to it.
- Body stories remain left-aligned under centered chapter headings. Navigation, buttons, forms, hours, dates, prices and other facts always use regular type. All artwork enters with its surrounding group; no separate decorative animation.

## Mobile hours and hero contacts

- Keep the hours strip indigo at every width. Phones use centered rows with short day labels beside the complete times. The canonical CMS summary remains accessible, and enlarged text can wrap.
- `HeroContacts` provides two plain icon-and-value rows after the hero actions on phones and tablets, with the complete address and phone, compact 14px type and at least 44px touch targets. No cards or redundant action labels.
- Wider screens retain the inline contact overlay. Keep these factual details in Mona Sans, separate from decorative handwriting and leaves.
