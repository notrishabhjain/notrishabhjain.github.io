// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Single place the deployed origin is configured. Swapping in a custom domain
// later is a one-line change here plus a public/CNAME file — nothing else in
// the codebase hardcodes the origin.
export const SITE = 'https://notrishabhjain.github.io';

export default defineConfig({
  site: SITE,
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  // No client-side framework. The only JavaScript that ships is the ~20 lines
  // of inline theme handling in the base layout.
  devToolbar: { enabled: false },
  integrations: [sitemap()],
  // Case studies moved from /case-studies/ to /work/ when the site became a
  // multi-page portfolio; keep the old URLs resolving.
  redirects: {
    '/case-studies/[...slug]': '/work/[...slug]',
  },
});
