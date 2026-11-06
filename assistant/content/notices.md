# Notices and closures

Use the notices wizard. Read [CMS workflow](../CMS.md) for the current connection and publishing route. Edit Sanity **Notices and closures**, not the old `notices.ts` migration input.

A `notice` has a stable `slug.current`, short `message`, required `startsOn` and `endsOn` dates, and an optional `link` with `label` and `href`. Dates use YYYY-MM-DD, include the whole final day, and mean America/Los_Angeles. The end cannot precede the start. Confirm the actual closure dates with weekdays; do not assume holiday policy.

## Banner days vs closed days

`startsOn`/`endsOn` only say **when the banner shows**. Two more fields say what the notice means for the library's regular programs (Story Time, Book Club, Main Street Readers):

- `closedDates`: a list of YYYY-MM-DD days (Pacific) the library is **fully closed**. Studio: "Days the library is closed". List every closed day separately: Thanksgiving Thursday–Saturday is `["2026-11-26", "2026-11-27", "2026-11-28"]`. Closed days usually fall inside the banner's dates; Studio warns if one doesn't.
- `staysOpen`: `true` when the library stays open (shorter hours, an early closing, a reminder). Studio: "The library stays open (not a closure)".

Fill exactly one of them on every new notice. Never both (Studio blocks it; if it happens anyway, the website uses `closedDates`).

What the website does with it: each program page lists its next dated sessions, worked out from the program's regular schedule, and tells Google about each one as an event (the dates can show up in Google search results and maps). Sessions are left off on:

| Notice has | Program sessions left off |
| --- | --- |
| `closedDates` | Only those days. |
| `staysOpen: true` | None. |
| Neither (older notices) | Every day the banner shows, to be safe. |

Examples:

```json
{"message": "Closed Thursday, Nov 26 for Thanksgiving. Happy holidays!", "startsOn": "2026-11-16", "endsOn": "2026-11-26", "closedDates": ["2026-11-26"]}
{"message": "Open 11 a.m.–1 p.m. on Thursday, Dec 24.", "startsOn": "2026-12-14", "endsOn": "2026-12-24", "staysOpen": true}
{"message": "No Story Time this Wednesday, Dec 9. See you next week!", "startsOn": "2026-12-02", "endsOn": "2026-12-09", "closedDates": ["2026-12-09"]}
```

The last example cancels one Story Time. `closedDates` removes **every** regular program that day, so use it to cancel one session only when no other program meets that day (check the programs' schedules); otherwise just post the banner and say in it which program is off. (A program that has a dated event on a day already skips its regular session that day.)

Do not add `closedDates` or `staysOpen` to old published notices just to tidy them; change a notice only when someone asks.

The same notice appears above the header on every page. Its visibility updates at the date boundaries in the visitor's browser without rebuilding the site. Avoid duplicate banners for the same closure. Correct or unpublish the existing notice when requested, then use the normal checked publishing route.

Permanent opening-hours changes belong in **Library settings and hours → Contact and hours → Opening hours** (`siteSettings.library.hours` on `library-settings`). Edit that shared table once. The website derives the phone link and hours summary; do not update hidden imported fields or change page copies individually. A temporary closure can use a notice without replacing the regular hours.

Save a draft through permitted Sanity tools and show the proposed notice here. After confirmation, use the supported publishing tool to queue the website preview. Studio is a fallback for an unavailable operation. Follow [publishing workflow](../WORKFLOW.md) and verify the actual banner/hours after approval. Expired notices are already hidden; cleanup is separate from fixing a display problem.

Field definitions: `studio/schemas/documents.ts`, `studio/schemas/objects.ts`. Website rule: `noticeClosesDay` in `src/content/seo.mjs`.
