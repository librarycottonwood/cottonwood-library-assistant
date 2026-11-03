# Redesign plan: every page on the new design

Figma file `ZHygohymNhKRQyxIhQsQ2P`, page 0:1. Rules for building: `docs/design-system.md`. Old pages (`SiteLayout`) get no new work; each one is replaced, then deleted.

## Phase 1 (this PR)

- Header and footer navigation follow Figma, from one list in `src/components/site/navigation.ts` (site structure, so it lives in code, not Sanity).
- Header Donate goes to `/donate/` and still sends `donate_header`.
- `/donate/` (first version of Figma "Support Us"): page title + the giving block; its Donate button opens the Givebutter popup (`donate_quick`).
- New block: `PageTitle`.

Until a page moves to the new design, its nav link points at the old page (Explore Services → `/visit/#services`, Events & News → `/librarynews/`, About Us → `/our-story/`). When a page ships, its PR changes the link and adds the redirect below.

## Components

### Have (src/components/site)

BaseLayout, SiteHeader, SiteFooter, SiteNotices, NewsletterForm (added by the layout) · Section, Split, Stack, Grid (layout) · Heading, Text, Button, Badge, IconLink (text and actions) · Card, EventCards (lists) · **PageTitle** (new).

### Need (built first in phase 2, each with a usage block and a /components entry)

| Name | Figma | Props | Notes |
| --- | --- | --- | --- |
| `PageTitle` ✅ | every page's title; Service View / Event View breadcrumb + date | `title`, `trail?: {label, href}[]`, `headingId?`, slot = muted line (date) | Done in phase 1. |
| `Split` `panel` option | Visit Us hours, Story Time, Events alt | `panel?: boolean`: the text column sits on a pale-indigo panel that bleeds off the page edge | Needs a new color token (see questions). |
| `Split` `inset` option | Explore Services blocks | `bleed?: boolean` (default true): `false` keeps the photo inside the content width, rounded on all corners | |
| `DetailList` | Visit hours table, printing prices | `items: {label, value, muted?}[]` | One component for hours and prices; "Closed" is muted. |
| `Faq` | Visit, Explore Services, Service View | `items: {question, answer}[]`, `headingId` | `<details>`, + / × icons, dividers. Content: Sanity "Borrowing and computer information". |
| `MapCard` | "Find us" on Visit, Service View, Event View | `library` | New-design wrapper of the existing map, address + phone pills on its top edge (as in the hero). |
| `WideImage` | Event View photo, About photo | `image`, `bleed?: 'end'` | One large rounded photo under the page title. |
| `Prose` | About text, event/news body, privacy | `blocks?: RichTextBlock[]` or slot | 622px reading column, h2/h3, links, lists. |
| `Gallery` | About gallery, founders pair, news photos | `images: LibraryImage[]`, `columns?: 2 \| 3` | Rounded photos, phone = 1 column. |
| `PostList` | Latest News | `posts: LibraryPost[]`, `initial?: number` | Photo left, date, title, summary, "Read more"; "Load more news" reveals the rest (works without JS). |
| `ProgramCards` | Events alt "Regular Events" | `programs: Program[]` | Two wide cards with a schedule badge. May just be `EventCards` with programs only. |
| `Signature` | About "Thank you for your support!" + logo | none | Small logo + name lockup. |

## Pages and URLs

| Figma frame | New URL | Today | Redirect when it ships |
| --- | --- | --- | --- |
| Index `1001:2` | `/` | `/` | none |
| Explore Services `1002:423` | `/services/` | part of `/visit/` | none (old `#services` anchor just lands on Visit Us) |
| Service View `1012:1243` | `/services/<id>/` (borrowing, computers, printing, story-time, …) | none | none |
| Events & News `1002:772` / alt `1026:2163` | `/events/` | `/librarynews/` | `/librarynews/` → `/events/` |
| Event View `1021:1494` | `/events/<slug>/` (same URL) | `/events/<slug>/` | none |
| (no frame) news post, Event View layout | `/news/<slug>/` | `/librarynews/<slug>/` | `/librarynews/[slug]` → `/news/[slug]` |
| Visit Us `1002:539` | `/visit/` | `/visit/` | none |
| About Us `1012:122` | `/about/` | `/our-story/` | `/our-story/` → `/about/` |
| Support Us `1012:1364` | `/donate/` | `/fundraising-events/` | `/fundraising-events/` → `/donate/` |

Redirects go in `astro.config.mjs` (`redirects`), like the existing ones. Hosting config files (`_redirects`) are rejected by the publish workflow, so don't add one.

## Order

1. **Blocks PR**: `DetailList`, `Faq`, `MapCard`, `Split` panel/inset, `Prose`, `WideImage`, `Gallery`, `PostList`, in /components with docs. No page changes.
2. **Visit Us** (hours, map, FAQ: what launch-day visitors need most).
3. **Explore Services + Service View**.
4. **Events & News + Event View + news posts**.
5. **About Us**.
6. **Support Us** (full `/donate/`: other ways to help, fundraiser form; then redirect `/fundraising-events/`).
7. **Leftovers** (see questions), then delete `SiteLayout`, `global.css`, the old components and the Sanity "Main navigation" field.

One PR, preview and review per step.

## Content gaps (Sanity)

Pages only arrange Sanity content. These Figma pieces have no Sanity field yet, so each needs a schema addition (Studio change) before its page:

- Explore Services: per-service subsections ("Getting started", "Renewals & returns"), late-fee note, printing price rows, service photos.
- About Us: three titled sections, founders photos, gallery (today: one heading, paragraphs, one photo).
- Support Us "Other ways to help": the three texts exist (books & DVDs, book sale, WOW points); their photos don't.
- Service View: what the three buttons and the empty right panel are.

## Open questions

1. **Kids & families** (`/kids/`): fold into Explore Services as a "Story Time" service page and redirect, or keep a separate page?
2. **Newsletter** (`/librarynews/newsletter/`): move to `/newsletter/` on the new design (title, current issue, archive)?
3. **Privacy** and **404**: port as simple pages (PageTitle + Prose; 404 = title, one line, Home button)?
4. **Events & News**: which version, main or alt (alt adds "Regular Events" and the panel)?
5. **Panel color**: Figma's pale indigo panel isn't a token. Add `--color-primary-soft` (about `#e3e6fb`)?
6. **Support Us** has a ~1,400px empty area under the title. Proposal: the active fundraiser with its Givebutter form (what `/fundraising-events/` shows today).
7. **Fundraiser and volunteer pages** (`/fundraising-events/<slug>/`): move to `/donate/<slug>/`?
8. **Analytics**: the `/donate/` button counts as `donate_quick`. Want a separate `donate_page` event? (It also needs a connector change.)

## Where Figma differs on purpose

- Footer: Figma leaves out Visit Us; the footer includes it so both menus match.
- Footer keeps the Privacy links (needed for the statistics choice); Figma has none.
- Homepage Get directions and Donate stay indigo (commit 944ff04 chose that); Figma shows green.
- Hours always come from Sanity. Figma's Visit Us table shows Saturday 11–5, but the header shows 11–2.
