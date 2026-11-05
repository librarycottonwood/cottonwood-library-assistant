# Redesign plan: every page on the new design

Figma file `ZHygohymNhKRQyxIhQsQ2P`, page 0:1. Rules for building: `docs/design-system.md`.

**Status (Nov 2, 2026): every page is on the new design.** `SiteLayout`, `PageLayout`, `global.css` and the old components are deleted. Old URLs redirect (table below). New blocks beyond the list below: `FundraiserForm` (Givebutter form on Support Us); `EventCards` got `fill`, `Prose` got `steps` and a slot; `Card` got `shape="page"` for newsletter covers. Not built: `ProgramCards` (plain `Card` + schedule `Badge` does the job) and `Signature` (no content for it).

## Page build kit (Nov 2, 2026 rebuild against Figma)

Read first: `docs/design-rules.md` "Where content lives" and `docs/design-system.md` rules 1–7. Pages only compose `src/components/site/`; page text that isn't frequently changing is written in the page file in Figma's wording.

- **Figma specs** (verbatim text, layout, token snaps), on this machine: `/tmp/figma/spec/{home,services,service-view,events,event-view,visit,about,support}.md`. Figma's MCP quota is used up; work from these.
- **Photos** (in `src/content/images.ts`, use as `{ key, alt }`): `borrowingShelves` (Borrowing books), `computerRoom` (Computers and Wi-Fi), `copyRoom` (Printing), `entrance` (Visit), `bookSale` (Event View sample / Shop the book sale), `newReads` (Donate books & DVDs), `holidayMarket` (WOW points), `cattleDrivePainting` (About top), `foundersPortrait` + `founders` (About "A place of our own"), About gallery: `founders`, `libraryBuilding`, `countyCertificate`, `thankYouNote`, `muralOrchard`, `muralPicnicTable`. Story Time's photo is the Sanity program image. Write real alt text.
- **Components added for the rebuild:** `TopicList` (bold sub-heading + muted paragraph, e.g. "Getting started"), `Text note` (italic side note, e.g. late fees), `Signature` (About sign-off). Existing: `Split` (`inset` for service rows, `panel` for photo + panel), `DetailList` (price table), `Faq`, `MapCard`, `WideImage` (`bleed` for About), `Gallery` (2 or 3 columns), `Card` + `Badge` (Regular Events, Other ways to help), `PostList`, `Prose`, `PageTitle`, `Button` (accent `navigate`, outline `book`, primary `heart`).
- **Token snaps** (Figma value → token): 50px gaps/padding → `--space-md`/`--space-lg` (components decide); 1120px text column → `--width-text` 920; 805px panel → Split panel ratio; 200px row gap → section spacing; rgba(0,0,0,.15) borders → `--border-image`; 30px card titles → 24px (`--text-body`); button 24/16 padding and 26px icons → Button as is.
- Need something else? Push `REQUEST-<name>.md` on your branch; don't edit components, layouts, tokens, nav or `astro.config.mjs`.

## Phase 1 (this PR)

- Header and footer navigation follow Figma, from one list in `src/components/site/navigation.ts` (site structure, so it lives in code, not Sanity).
- Header Donate goes to `/donate/` and still sends `donate_header`.
- `/donate/` (first version of Figma "Support Us"): page title + the giving block; its Donate button opens the Givebutter popup (`donate_page`).
- New block: `PageTitle`.


## Components

### Have (src/components/site)

BaseLayout, SiteHeader, SiteFooter, SiteNotices, NewsletterForm (added by the layout) · Section, Split, Stack, Grid (layout) · Heading, Text, Button, Badge, IconLink (text and actions) · Card, EventCards (lists) · **PageTitle** (new).

### Need (built first in phase 2, each with a usage block and a /components entry)

| Name | Figma | Props | Notes |
| --- | --- | --- | --- |
| `PageTitle` ✅ | every page's title; Service View / Event View breadcrumb + date | `title`, `trail?: {label, href}[]`, `headingId?`, slot = muted line (date) | Done in phase 1. |
| `Split` `panel` option | Visit Us hours, Story Time, Events alt | `panel?: boolean`: the text column sits on a pale-indigo panel (`--color-primary-soft`) that bleeds off the page edge | |
| `Split` `inset` option | Explore Services blocks | `bleed?: boolean` (default true): `false` keeps the photo inside the content width, rounded on all corners | |
| `DetailList` | Visit hours table, printing prices | `items: {label, value, muted?}[]` | One component for hours and prices; "Closed" is muted. |
| `Faq` | Visit, Explore Services, Service View | `items: {question, answer}[]`, `headingId` | `<details>`, + / × icons, dividers. Content: Sanity "Borrowing and computer information". |
| `MapCard` | "Find us" on Visit, Service View, Event View | `library` | New-design wrapper of the existing map, address + phone pills on its top edge (as in the hero). |
| `WideImage` | Event View photo, About photo | `image`, `bleed?: 'end'` | One large rounded photo under the page title. |
| `Prose` | About text, event/news body, privacy | `blocks?: RichTextBlock[]` or slot | 622px reading column, h2/h3, links, lists. |
| `Gallery` | About gallery, founders pair, news photos | `images: LibraryImage[]`, `columns?: 2 \| 3` | Rounded photos, phone = 1 column. |
| `PostList` | Latest News | `posts: LibraryPost[]`, `initial?: number` | Photo left, date, title, summary, "Read more"; "Load more news" reveals the rest (works without JS). |
| `ProgramCards` | Events alt "Regular Events" | `programs: Program[]` | Wide cards with a schedule badge, built in the Events & News PR. |
| `Signature` | About "Thank you for your support!" + logo | none | Small logo + name lockup. |

## Pages and URLs

Historical plan: many redirects below were never added or were later removed. The `redirects` list in `astro.config.mjs` is the source of truth.

| Figma frame | New URL | Today | Redirect when it ships |
| --- | --- | --- | --- |
| Index `1001:2` | `/` | `/` | none |
| Explore Services `1002:423` | `/services/` | part of `/visit/` | none (old `#services` anchor just lands on Visit Us) |
| Service View, Story Time | `/services/story-time/` | `/kids/` | `/kids/` → `/services/story-time/` |
| Service View `1012:1243` | `/services/<program>/` (story-time, main-street-readers, book-club) | `/librarynews/<program>/` | each old program URL → its `/services/` page |
| Events & News `1002:772` / alt `1026:2163` | `/events/` | `/librarynews/` | `/librarynews/` → `/events/` |
| Event View `1021:1494` | `/events/<slug>/` (same URL) | `/events/<slug>/` | none |
| (no frame) news post, Event View layout | `/news/<slug>/` | `/librarynews/<slug>/` | `/librarynews/[slug]` → `/news/[slug]` |
| Visit Us `1002:539` | `/visit/` | `/visit/` | none |
| About Us `1012:122` | `/about/` | `/our-story/` | `/our-story/` → `/about/` |
| Support Us `1012:1364` | `/donate/` | `/fundraising-events/` | `/fundraising-events/` → `/donate/` |
| (Support Us layout) fundraiser / volunteer pages | `/donate/<slug>/` | `/fundraising-events/<slug>/` | `/fundraising-events/[slug]` → `/donate/[slug]` |
| Newsletter | `/newsletter/` | `/librarynews/newsletter/` | `/librarynews/newsletter/` → `/newsletter/` (and update the existing `/librarynews/summer-2026/` redirect) |
| Privacy, 404 | `/privacy/`, 404 | same | none |

Redirects go in `astro.config.mjs` (`redirects`), like the existing ones. Hosting config files (`_redirects`) are rejected by the publish workflow, so don't add one.

## Order

1. **Blocks PR**: `DetailList`, `Faq`, `MapCard`, `Split` panel/inset, `Prose`, `WideImage`, `Gallery`, `PostList`, in /components with docs. No page changes.
2. **Visit Us** (hours, map, FAQ: what launch-day visitors need most).
3. **Explore Services + Service View**.
4. **Events & News + Event View + news posts**.
5. **About Us**.
6. **Support Us** (full `/donate/`: other ways to help, fundraiser form; then redirect `/fundraising-events/`).
7. **Leftovers**: newsletter, privacy, 404. Then delete `SiteLayout`, `global.css`, the old components and the Sanity "Main navigation" field.

Shipped as one PR (#67), one commit per page.

## Content gaps (Sanity)

Pages only arrange Sanity content. These Figma pieces have no Sanity field yet, so they are left out until a schema addition (Studio change) adds them:

- Explore Services: per-service subsections ("Getting started", "Renewals & returns"), late-fee note, printing price rows, service photos (library photos stand in, by service icon).
- Service pages: only regular programs (Story Time, Main Street Readers, Book Club) have pages; borrowing, computers and printing have just a title and one sentence, so they stay sections of `/services/`.
- About Us: three titled sections, founders portrait, gallery. Today: one heading, two paragraphs, the founders plaque and the library painting.
- Event View: no long description or event photo for the current events; pages show the summary, sessions and map.
- News: current posts have no photos; library photos stand in on the list.

## Decisions (Jaden, after phase 1)

1. **Kids & families** becomes the Story Time service page, `/services/story-time/`; `/kids/` redirects there.
2. **Newsletter, privacy, 404** move to simple new-design pages; the newsletter lives at `/newsletter/` (`/librarynews/newsletter/` redirects).
3. **Events & News uses the alt frame** (`1026:2163`): Sanity has 3 regular programs with photos but only 2 upcoming events (no photos) and 2 news posts (no photos), so the "Regular Events" row carries the page.
4. **`--color-primary-soft`** (`#e3e7ff`, from Figma) is a design-system token (added in phase 1).
5. **Support Us** shows the active fundraiser and its Givebutter form in the empty area, from the existing fundraiser records.
6. **Fundraiser and volunteer pages** move to `/donate/<slug>/`; `/fundraising-events/[slug]` redirects there.
7. **`donate_page`** is the event for the `/donate/` button (added in phase 1, website and Analytics connector).

## Where Figma differs on purpose

- Footer: Figma leaves out Visit Us; the footer includes it so both menus match.
- Footer keeps the Privacy links (needed for the statistics choice); Figma has none.
- Homepage Get directions and Donate stay indigo (commit 944ff04 chose that); Figma shows green.
- Hours always come from Sanity. Figma's Visit Us table shows Saturday 11–5, but the header shows 11–2.
