import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [tailwind(), react()],
  output: 'server',  // Change to server-side rendering
  vite: {
    resolve: {
      alias: {
        '@': '/src',
        '@lib': '/src/lib',
        '@components': '/src/components',
        '@types': '/src/types'
      }
    }
  }
});
