import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.cottonwoodcommunitylibrary.com',
  output: 'static',
  // Lists every public page for search engines (/sitemap-index.xml). The design-system pages stay out.
  integrations: [sitemap({ filter: page => !new URL(page).pathname.startsWith('/components') })],
  image: { remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io', pathname: '/images/**' }] },
  redirects: {
    // Pages of the old Square website (cottonwood-community-library.square.site/sitemap.xml, Nov 2026). Google,
    // Facebook posts and printed material link to these; they reach this site once the domain moves here.
    '/plan-your-visit': '/visit/',
    '/our-story': '/about/',
    '/librarynews': '/events/',
    '/fundraising-events': '/donate/',
    '/product/donate-to-the-library/1': '/donate/',
    '/s/shop': '/donate/',
    '/s/stories/story-title': '/events/',
  },
  devToolbar: { enabled: false },
});
