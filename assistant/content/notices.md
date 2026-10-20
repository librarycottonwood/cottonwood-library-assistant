# Notice banner: technical steps

First verify the active content provider using [CMS workflow](../CMS.md). Once Sanity is connected, use its records and Studio/connected tools; the source-file locations below describe the local prototype and migration inputs. Do not maintain both copies.

Used by the `notices` skill. Follow `assistant/WORKFLOW.md` for checking, preview and save.

## Where

`libraryNotices` in `src/content/notices.ts` (type `LibraryNotice`). The header comment in that file shows a full example. Empty list = no banner.

```ts
{
  id: 'thanksgiving-closure-2026',
  message: 'The library is closed Thursday–Saturday, November 26–28, for Thanksgiving.',
  startsOn: '2026-11-16',          // YYYY-MM-DD Pacific, first day shown
  endsOn: '2026-11-28',            // last day shown (inclusive)
  link: { label: 'See regular hours', href: '/#visit' }, // optional
},
```

## How it behaves

- Shown above the header on every page from `startsOn` through `endsOn`.
- A small script in the page hides it after `endsOn` and shows it on `startsOn` even without a rebuild, so a banner can be saved ahead of time.
- Keep messages to one short sentence. Several notices can run at once; keep it to one or two.
- Expired entries are harmless; delete them when you are next editing the file.
