// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';

// Retired products still build (old links land on a "no longer available" page) but are
// noindexed and kept out of the sitemap so search and AI engines don't surface them.
const productsDir = new URL('./src/content/products/', import.meta.url);
const retiredPaths = readdirSync(productsDir)
  .filter((f) => f.endsWith('.md') && /^retired:\s*true\s*$/m.test(readFileSync(new URL(f, productsDir), 'utf8')))
  .map((f) => `/shop/${f.replace(/\.md$/, '')}/`);

// https://astro.build/config
export default defineConfig({
  site: 'https://ecohappy.in',
  integrations: [sitemap({ filter: (page) => !retiredPaths.some((p) => page.endsWith(p)) })],
  image: {
    // Astro's built-in Sharp-based image service; used via <Image>/<Picture> on product photos
  },
});
