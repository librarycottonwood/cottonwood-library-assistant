# Newsletter: technical steps

Used by the `newsletter` skill. Follow `assistant/WORKFLOW.md` for checking, preview and save.

The site shows one current issue at `/librarynews/newsletter/`, plus a card in the news feed and on the home page.

## New issue

1. Save the PDF as `public/documents/cottonwood-library-newsletter-<season>-<year>.pdf` (lowercase, hyphens). Keep older PDFs unless asked to remove them.
2. Make the cover: render page 1 of the PDF to an image (e.g. `pdftoppm -png -r 110 -f 1 -l 1 file.pdf cover`), then run it through the picture rules: `pnpm assistant:image -- cover-1.png --name newsletter-cover`. If no PDF renderer is installed, ask the volunteer for a photo or screenshot of the cover. Replace `src/assets/newsletter-cover.jpg` (or update the `newsletter` import in `src/content/images.ts` to the new file and delete the old one so the picture check doesn't flag it as unused).
3. Update `newsletter` in `src/content/seed.ts`:

```ts
newsletter: {
  issue: 'Fall 2026',                       // shown as "Fall 2026 newsletter"
  title: 'A little news from your library', // headline on the card
  summary: 'Two sentences on what is inside.',
  fileUrl: '/documents/cottonwood-library-newsletter-fall-2026.pdf',
  cover: { key: 'newsletter', alt: 'Cover of the Cottonwood Community Library Fall 2026 newsletter.', fit: 'contain' },
},
```

4. Nothing else to edit: the newsletter post in `src/content/editorial.ts` (id `newsletter`) and the page take the issue name, title and summary from `newsletter`.

Everything else (page title, feed card) reads from `newsletter` automatically.
