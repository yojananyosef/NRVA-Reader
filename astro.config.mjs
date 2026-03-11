import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import node from '@astrojs/node';

export default defineConfig({
  site: 'https://accessible-reading.vercel.app',
  output: 'static',
  integrations: [preact(), sitemap()],

  image: {
    service: {
      entrypoint: 'astro/assets/services/noop'
    }
  },

  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          }
        }
      }
    }
  },

  adapter: node({
    mode: 'standalone'
  })
});