# Events

Use the events wizard to gather the facts. Read [CMS workflow](../CMS.md) for the current connection and publishing route. Ordinary event edits belong in Sanity, not the migration files in `src/content/`.

## Create or correct an event

Open **Events** in Studio, or use the connected Sanity tools to read the existing record and schema. An `event` holds the name (`title`), page address (`slug.current`), short description (`summary`), optional picture (`image`), location and related `program` reference. The optional picture becomes the agenda thumbnail and the homepage feature photo; without one, the agenda uses the program's picture, then the library photo.

**Confirmed dates** is `sessions[]`. Each `eventSession` needs a stable `_key`, `startsAt` and `endsAt`. Both times are required; the end must be later than the start. Use America/Los_Angeles for the event's date, including the correct daylight-saving offset. Repeat the date, weekday and time range to the volunteer before saving. Ask for a missing end time rather than guessing.

Add confirmed occurrences to the same event. A program's regular schedule is descriptive; it does not authorize inventing future dates. Reuse an existing program reference. The homepage, event list and calendar derive from these sessions; do not update each appearance separately.

Preserve document identity and existing page addresses when correcting an event. New slugs use lowercase letters/numbers separated by hyphens. An optional destination (`href`) must be an existing page or confirmed safe link. Use native uploaded image references and useful picture descriptions; do not add new migration image keys.

## Move, cancel or remove

- Move the requested session by changing both times, preserving other dates and references.
- For cancellation, ask whether to remove that occurrence or keep it visibly cancelled. There is no cancellation-status field: if keeping it, use clear cancelled wording in the title/summary. Check the effect on other sessions before changing a shared title.
- Before unpublishing or deleting an event, inspect references from posts and programs. Resolve affected references with the volunteer; do not delete unrelated content or shared assets.

Events remain promoted until their confirmed end time, including while they are happening. Ended sessions disappear from Coming up and the events agenda without deleting the historical event page.

Save edits as a CMS draft through permitted tools or the real Studio. Show the proposed event in chat. After the volunteer confirms it, use the supported CMS publishing tool to queue the preview, then follow the Codex PR preview/link and chat approval workflow to publish it live. Studio is a fallback when a required tool is unavailable. Verify the hosted result as described in [publishing workflow](../WORKFLOW.md). A private CMS draft has no website preview in the current implementation.

Field definitions: `studio/schemas/documents.ts`, `studio/schemas/objects.ts`. Read the current schema before a tool mutation; Studio validation alone does not protect API writes.
