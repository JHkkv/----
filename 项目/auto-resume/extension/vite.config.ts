import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import { resolve } from 'path';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../shared'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        boss: 'src/content/boss.ts',
        wuyou: 'src/content/wuyou.ts',
        liepin: 'src/content/liepin.ts',
        zhilian: 'src/content/zhilian.ts',
      },
      output: {
        entryFileNames: 'content/[name].js',
      },
    },
  },
});
