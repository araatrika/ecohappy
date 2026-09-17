// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://ecohappy.in',
  integrations: [sitemap()],
  image: {
    // Astro's built-in Sharp-based image service; used via <Image>/<Picture> on product photos
  },
});
