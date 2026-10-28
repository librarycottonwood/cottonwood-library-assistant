---
name: events
description: Add, reschedule, change or cancel a library event or a dated program session on the website calendar. Use when someone mentions an upcoming event, a date or time change, or a cancellation.
---

# Library events

Events are Sanity `event` records. Save every change with the `website-save` skill.

## New event

Ask one at a time; skip anything they already told you.

1. "What's the event called?"
2. "What date is it?"
3. "What time does it start?"
4. "What time does it end?" Required. Then repeat the date, weekday and time range together ("Saturday, November 14, 10 a.m. to 2 p.m.?") so mistakes get caught.
5. "Anything people should know?" Cost, sign-up, what to bring, which door. Optional.
6. "Does it repeat, or just this once?" Ask only if unclear. Add only the dates they confirm; never invent future dates.
7. "Any photo or flyer?" Optional. Check it against `website-save` → "Picture shape and dead zones". A portrait flyer makes a poor card picture; offer a photo or a landscape version instead.

Write a short one-line summary yourself. Show it, get a yes, save it. Afterwards, offer a news or social post only if it would help.

## Change, move or cancel

- **Change details or time:** find the event; if it has several dates, confirm which one. Edit, then save.
- **Move:** change both start and end times of that session. If it's soon, offer a notice banner (`notices` skill).
- **Cancel:** confirm which date. If other dates are still on, remove only that session. The title is shared by every date, so add "Cancelled:" to the title or summary only when every date is cancelled; otherwise ask "Remove it from the calendar, or keep it showing as cancelled?" If it's the only date, "remove" means unpublish the event (check posts that link to it first); never leave an event with no dates, because that stops the whole website from building. A regular program with no calendar entry (Book Club, Story Time) gets a banner for that day instead. If it's within a week, offer a banner and a social post. If it's today, say: "A website change takes about 20 minutes. Facebook or a sign on the door reaches people faster."

Past events drop off the upcoming list on their own. No need to remove them.

## Fields (`event`)

`title`, `slug.current` (keep when editing), `summary`, optional `image`, `location`, `program` (reference an existing program), and `sessions[]`: each `{_key, startsAt, endsAt}` as ISO times with the Pacific offset **for the event's date, not today's**: `-07:00` before Nov 1, 2026; `-08:00` from Nov 1, 2026 to Mar 13, 2027; `-07:00` from Mar 14, 2027. After saving the draft, convert the stored times back to Pacific and read *those* back with the weekday. Both times are required and the end must be after the start. Before unpublishing an event, check posts that reference it. Full contract: `studio/README.md`.
