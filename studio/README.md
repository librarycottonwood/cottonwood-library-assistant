# Cottonwood Library CMS

This standalone Sanity Studio supplies the library's editing forms. The current account, editor address and connection evidence are maintained in [assistant/CMS.md](../assistant/CMS.md) and [assistant/setup-status.json](../assistant/setup-status.json). The native Studio and signed website publishing route have been connected and rehearsed. CMS publication queues a checked preview; approval and verified website deployment are separate steps. This package does not add paid AI tools.

## What volunteers edit

- **Events:** one record per event, with a list of confirmed dates. Every date requires a start and an end time, with the end later than the start. Date pickers and list previews use Pacific time. The website keeps each occurrence listed until it ends. A regular schedule does not invent dates.
- **Blog posts:** title, summary, formatted text, cover picture, photo gallery, and references to existing events.
- **Regular programs:** the reusable program description, picture, and regular schedule.
- **Newsletters:** upload a PDF and its cover, then select it under Library settings → Homepage. Older PDFs remain available.
- **Notices and closures:** a message and inclusive first/last dates, interpreted in Pacific time.
- **Library settings and hours:** contact details, one hours table, page introductions, services, borrowing information, story, and navigation. The website derives the callable phone link and hours summary; volunteers do not edit duplicates.
- **Giving and acknowledgments:** ways to help, visible community thank-yous, and approved Givebutter campaign/widget IDs. Payment processing and live totals remain in Givebutter.

Ordinary editing uses Sanity’s native draft, publish, history, image, file, and reference controls. Pictures require useful descriptions; posters/logos can display in full. Imported image keys and PDF paths keep existing assets working until replacements are uploaded. They are migration fields, not a second editing workflow.

**Publishing in Studio is not proof that the website is live.** It makes CMS content available to the website’s separately checked publishing workflow. That workflow builds a release, obtains approval, publishes the checked release, verifies the hosted result, and reports status. A persistent note in Studio makes this distinction explicit. No website deployment is performed by this package.

## Local checks without an account

Use Node 24 and the repository’s pnpm 11.15.1. The Studio has its own package and lockfile; it is deliberately separate from the Astro runtime.

```sh
pnpm --dir studio install --frozen-lockfile
pnpm --dir studio check
pnpm --dir studio build:offline
```

`build:offline` compiles using explicit fixture identifiers (`cmscheck` / `validation`). It does not log in, query library records, provision a project, or deploy. Its output is only a compilation artifact and must not be hosted as the library’s connected Studio. These checks do not establish that authentication, real uploads, role restrictions, publishing, or recovery work in the eventual library account.

The tests exercise the form validation rules for invalid event times and duplicate occurrences, closure dates, missing images/PDFs, unsafe links, and missing configuration. They also run Sanity’s built-in validators against the actual compiled form schema; these explicitly report custom validation as not evaluated without an API client. The custom rules are exercised directly in separate tests. The actual Sanity schema is also compiled/extracted in CI. API mutations bypass Studio validation: the website adapter and publishing service must validate retrieved records independently before deployment. UI singleton controls are convenience safeguards, not API access control.

To check a migration snapshot against the actual Studio schema without an account, run `pnpm --dir studio validate:import -- ../output/cms/migration.json`. This catches incompatible fields, missing required values, and wrong array/object types. Warnings are reported; unknown-field warnings fail the migration check because imported records must fit the volunteer editor. Hidden, read-only `migrationSource` preserves provenance. It reports its limits explicitly; it does not prove uploaded asset existence or permissions.

## Connect at the meeting

1. The library created its organization/project using its permanent GitHub identity `librarycottonwood`. Keep recovery and another administrator with the library; invite Jaden separately. Do not use a developer-owned project as the permanent home. Google sign-in is not yet linked/verified.
2. The nonprofit application for that project was submitted from the library Google account on October 20. Await the decision and verify free quotas; do not add a card or enable paid tools as part of this setup.
3. Choose the dataset name and visibility. A public published dataset must contain only public website material. Keep donor/private information outside it. Draft access, write access, and exports require appropriate authorization.
4. Copy `.env.example` to `.env.local` inside `studio/`, and fill in `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET`. These are public identifiers. Never place an API token in any `SANITY_STUDIO_*` variable: those variables are embedded in the browser bundle.
5. Import the reviewed content snapshot with the repository’s migration process. Check both singleton documents and all imported assets before enabling publication. No content is imported by `pnpm install` or `pnpm build`.
6. Run `pnpm --dir studio dev`. Configure the approved Studio origin in Sanity’s CORS settings after its final hosting address is selected. Hosting and role setup are separate human-owned operations.
7. Connect the signed publishing webhook and its separate approval/status service. Add draft preview access only through an authenticated server; never put a draft-read or publishing token in the public website or Studio environment.
8. Test one new event, a time correction, a photo post, a newsletter replacement, a closure, unpublishing, concurrent changes, and a deliberately failed update in the actual library account. Confirm the live website and the library-facing status agree. Test backup restore and recovery without Jaden or the Pi before handoff.

Use the current connection evidence before repeating setup. Native Studio publishing through the checked website route has been rehearsed; ChatGPT content editing and full recovery acceptance require their own observed results. Normal `dev` and `build` fail with setup instructions when identifiers are missing, instead of silently using a personal or example project. Keep literal `process.env.SANITY_STUDIO_*` references in `sanity.config.ts`: Sanity replaces these at production build time; passing the entire `process.env` object only works in development.

## Document contract

The adapter reads the raw Sanity snapshot envelope `{schemaVersion: 1, projectId, dataset, documents: [...]}`. Native image/file assets must be included in `documents` for resolution.

| Document | Fields |
| --- | --- |
| `siteSettings`, fixed `_id: library-settings` | `library`, `navigation`, `hero`, `services`, `borrowing`, `story`, `support` preserve the existing provider-neutral home shape. Optional `serviceImage`/`givingImage` replace shared section pictures. `currentNewsletter` references `newsletter`; programs are separate documents. |
| `givingSettings`, fixed `_id: library-giving` | `updates[]`, `initiatives[]`, `campaigns[]` preserve the existing support shape. |
| `event` | `slug.current`, `title`, `summary`, optional `image`, `sessions[{_key, startsAt, endsAt}]` with both times required, optional `location`, `href`, `program` reference. |
| `post` | `slug.current`, `title`, optional `publishedAt`/`dateLabel`, `category`, `summary`, `body` Portable Text, optional `image`, `gallery[]`, `eventRefs[]`, imported `href`, `externalUrl`, `sourceLabel`. |
| `program` | `slug.current` is the existing program ID; `audience`, `title`, `schedule`, `description`, `details`, `image`, optional `orderRank`. |
| `newsletter` | `slug.current` is the stable archive address; `issue`, `title`, `summary`, `file` (Sanity file asset) **or** migration-only `legacyFileUrl`, `cover`. |
| `notice` | `slug.current`, `message`, `startsOn`, `endsOn`, optional `link{label, href}`. |

Slugs use lowercase letters/numbers separated by hyphens. Preserve existing slugs when editing so shared links continue to work. Singleton templates and duplicate/delete/unpublish actions are excluded from the editing menu; the adapter separately enforces the expected IDs.

Sanity array object members need the matching `_type` and a stable `_key` to remain editable:

| Path | `_type` |
| --- | --- |
| `siteSettings.library.hours[]` | `hoursRow` |
| `siteSettings.navigation[]` | `navigationLink` |
| `siteSettings.services[]` | `libraryService` |
| `siteSettings.borrowing[]` | `borrowingAnswer` |
| `givingSettings.updates[]` | `supportUpdate` |
| `givingSettings.initiatives[]` | `supportInitiative` |
| `givingSettings.campaigns[]` | `fundraisingCampaign` |
| `event.sessions[]` | `eventSession` |
| Any image/cover/gallery member | `libraryImage` |

Nested named values use `givebutterAccount` for `library.givebutter`, `donationWidget` for campaign `givebutter`, `initiativeAction` for initiative `action`, and `navigationLink` for a notice’s optional `link`. Inline settings objects use `object`. Portable Text uses native `block`/`span`; references use `reference`.

Images have `asset._ref` **or** migration-only `legacyKey`, plus required `alt`, optional `caption`, and `fit: cover | contain`. A real uploaded asset takes priority over the legacy key. Uploaded newsletter files are constrained to PDF in the picker and checked against the asset MIME type before Studio publication.

## Sources used for setup

- [Sanity Studio installation](https://www.sanity.io/docs/studio/installation)
- [Form validation and its API boundary](https://www.sanity.io/docs/studio/validation)
- [Environment variables](https://www.sanity.io/docs/studio/environment-variables)
- [Nonprofit plan](https://www.sanity.io/docs/platform-management/non-profit-plan)

Dependencies were pinned against official npm metadata on October 20, 2026: Sanity 6.20.0, React/React DOM 19.3.1, styled-components 6.6.0. Future upgrades must pass Studio compilation/schema checks and the end-to-end publishing rehearsals before the library’s hosted Studio is updated.
