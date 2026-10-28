# Notices and closures

Use the notices wizard. Read [CMS workflow](../CMS.md) for the current connection and publishing route. Edit Sanity **Notices and closures**, not the old `notices.ts` migration input.

A `notice` has a stable `slug.current`, short `message`, required `startsOn` and `endsOn` dates, and an optional `link` with `label` and `href`. Dates use YYYY-MM-DD, include the whole final day, and mean America/Los_Angeles. The end cannot precede the start. Confirm the actual closure dates with weekdays; do not assume holiday policy.

The same notice appears above the header on every page. Its visibility updates at the date boundaries in the visitor's browser without rebuilding the site. Avoid duplicate banners for the same closure. Correct or unpublish the existing notice when requested, then use the normal checked publishing route.

Permanent opening-hours changes belong in **Library settings and hours → Contact and hours → Opening hours** (`siteSettings.library.hours` on `library-settings`). Edit that shared table once. The website derives the phone link and hours summary; do not update hidden imported fields or change page copies individually. A temporary closure can use a notice without replacing the regular hours.

Save a draft through permitted Sanity tools and show the proposed notice here. After confirmation, use the supported publishing tool to queue the website preview. Studio is a fallback for an unavailable operation. Follow [publishing workflow](../WORKFLOW.md) and verify the actual banner/hours after approval. Expired notices are already hidden; cleanup is separate from fixing a display problem.

Field definitions: `studio/schemas/documents.ts`, `studio/schemas/objects.ts`.
