import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  image: { remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io', pathname: '/images/**' }] },
  // Old address of the newsletter page, which now always shows the current issue.
  redirects: { '/librarynews/summer-2026/': '/librarynews/newsletter/' },
  vite: { plugins: [tailwindcss()] },
  devToolbar: { enabled: false },
});
