import { defineConfig } from 'vite'

export default defineConfig({
  base: '',
  build: {
    sourcemap: true,
    assetsInlineLimit: 32768
  }
});
