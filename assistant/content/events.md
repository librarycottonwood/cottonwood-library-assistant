# Events: technical steps

Used by the `events` skill. Follow `assistant/WORKFLOW.md` for checking, preview and save.

## Where

`libraryEvents` in `src/content/editorial.ts`. Type `LibraryEvent` in `src/content/types.ts`. They appear in the calendar and list on `/librarynews/` and the home page. Past events drop off automatically (`src/content/feeds.ts`).

```ts
{
  id: 'story-time-2026-11-08',          // lowercase, unique: name + date
  title: 'Saturday Story Time',
  startsAt: '2026-11-08T10:00:00-08:00', // Pacific with offset: -07:00 summer (PDT), -08:00 winter (PST)
  endsAt: '2026-11-08T11:00:00-08:00',  // optional
  summary: 'Stories and a craft for ages 3–8. Free.', // one short line
  href: '/librarynews/story-time/',     // the page with details
},
```

- One entry per date. A repeating event is several entries (a `.map` over dates is fine, as the book sale does).
- Check the UTC offset for the date: daylight saving ends the first Sunday in November and starts the second Sunday in March.
- `href`: a related news post or support page if one exists; otherwise `/librarynews/`. Don't link to a page that doesn't exist — `pnpm assistant:capture` checks internal links.
- **Move:** change `startsAt`/`endsAt` and the `id` date. **Cancel:** remove the entry, or keep it with `title: 'CANCELLED: …'` and a summary saying so if the volunteer asked to keep it visible.
- Keep events in date order.
