// vite.config.js
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  base: '',
  build: {
    sourcemap: true,
    assetsInlineLimit: 32768
  },
  plugins: [preact({
    prefreshEnabled: false
  })],
});
