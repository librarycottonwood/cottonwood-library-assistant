# News posts: technical steps

First verify the active content provider using [CMS workflow](../CMS.md). Once Sanity is connected, use its records and Studio/connected tools; the source-file locations below describe the local prototype and migration inputs. Do not maintain both copies.

Used by the `news` skill. Follow `assistant/WORKFLOW.md` for checking, preview, save and the picture rules.

## Where

`libraryPosts` in `src/content/editorial.ts` (type `LibraryPost` in `src/content/types.ts`). Each post gets its own page at `/librarynews/<id>/` and appears in the news feed and on the home page, newest first.

```ts
{
  id: 'fall-story-time-recap',              // lowercase-with-hyphens; becomes the address
  title: 'Thank you for a wonderful Story Time!',
  publishedAt: '2026-10-12',                // YYYY-MM-DD; null only for undated items
  category: 'Library news',                 // or 'Event recap', 'Your support matters'
  summary: 'One line for the feed card.',
  href: '/librarynews/fall-story-time-recap/', // must match id
  paragraphs: ['Short paragraph.', 'Short paragraph.'],
  image: { key: 'storyTimeRecap1', alt: 'Kids listening to a story on the alphabet rug.' },   // optional cover
  gallery: [{ key: 'storyTimeRecap2', alt: 'Volunteers handing out crafts.', caption: 'Craft time!' }], // optional
},
```

## Photos

1. `pnpm assistant:image -- <file> --name <short-name>` for each photo.
2. Import it in `src/content/images.ts` and add the key to the `images` registry.
3. Use the key in `image` / `gallery`. `alt` describes the photo; `caption` is optional.

Every registered picture must be used somewhere or the picture check fails. When removing a post, remove its photos from `images.ts` and the files too, unless another page uses them.

## Edit or remove

- Edit the entry in place; keep `id`/`href` unchanged so links keep working.
- Remove: delete the entry (and unused photos). Search `src/` for its `href` and fix any links to it.
