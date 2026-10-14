import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  redirects: {
    // Old address of the newsletter page, which now always shows the current issue.
    '/librarynews/summer-2026/': '/librarynews/newsletter/',
    // The old separate "Keep the library open" page; the Donate page is now the only donation page.
    '/fundraising-events/library-fund/': '/fundraising-events/',
  },
  vite: { plugins: [tailwindcss()] },
  devToolbar: { enabled: false },
});
