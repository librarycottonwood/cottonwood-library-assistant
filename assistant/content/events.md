# Events

Use the events wizard to gather the facts. Read [CMS workflow](../CMS.md) for the current connection and publishing route. Ordinary event edits belong in Sanity, not the migration files in `src/content/`.

## Create or correct an event

Open **Events** in Studio, or use the connected Sanity tools to read the existing record and schema. An `event` holds the name (`title`), page address (`slug.current`), short description (`summary`), optional picture (`image`), location and related `program` reference. The optional picture becomes the agenda thumbnail and the homepage feature photo; without one, the agenda uses the program's picture, then the library photo.

**Confirmed dates** is `sessions[]`. Each `eventSession` needs a stable `_key`, `startsAt` and `endsAt`. Both times are required; the end must be later than the start. Use America/Los_Angeles for the event's date. Write full times with seconds and the offset for **that event's date** (not today's):

- before November 1, 2026: `-07:00` (for example `2026-10-31T10:00:00-07:00`);
- November 1, 2026 through March 13, 2027: `-08:00` (for example `2026-11-14T10:00:00-08:00`);
- from March 14, 2027: `-07:00`.

Read the date back in Pacific time with its weekday and time range ("Saturday, November 14, 10:00 a.m.–2:00 p.m.") before saving. For an all-day event, ask once for the times; if there are none, use 12:00:00 a.m. to 11:59:00 p.m. that day (`T00:00:00` to `T23:59:00`) and say "All day" in the summary. Ask for a missing end time rather than guessing.

Add confirmed occurrences to the same event. A program's regular schedule is descriptive; it does not authorize inventing future event records. The website itself lists each program's next sessions (about 90 days) from a schedule it can read, such as "Wednesdays · 11:30 a.m." or "Third Tuesday · 2:30 p.m.", and gives them to Google as events. It skips days a notice lists in `closedDates` (or, for older notices without closed days, every day the banner shows) and days the program has a dated event. To cancel one regular session, see [Notices](notices.md), "Banner days vs closed days". Reuse an existing program reference. The homepage, event list and calendar derive from these sessions; do not update each appearance separately.

Preserve document identity and existing page addresses when correcting an event. New slugs use lowercase letters/numbers separated by hyphens. An optional destination (`href`) must be an existing page or confirmed safe link. Use native uploaded image references and useful picture descriptions; do not add new migration image keys.

## Move, cancel or remove

- Move the requested session by changing both times, preserving other dates and references.
- For cancellation, ask whether to remove that occurrence or keep it visibly cancelled. There is no cancellation-status field: if keeping it, use clear cancelled wording in the title/summary. Check the effect on other sessions before changing a shared title.
- Before unpublishing or deleting an event, inspect references from posts and programs. Resolve affected references with the volunteer; do not delete unrelated content or shared assets.

Events remain promoted until their confirmed end time, including while they are happening. Ended sessions disappear from Coming up and the events agenda without deleting the historical event page.

Save edits as a CMS draft through permitted tools or the real Studio. Show the proposed event in chat. After the volunteer confirms it, use the supported CMS publishing tool to queue the preview, then follow the Codex PR preview/link and chat approval workflow to publish it live. Studio is a fallback when a required tool is unavailable. Verify the hosted result as described in [publishing workflow](../WORKFLOW.md). A private CMS draft has no website preview in the current implementation.

Field definitions: `studio/schemas/documents.ts`, `studio/schemas/objects.ts`. Read the current schema before a tool mutation; Studio validation alone does not protect API writes.
