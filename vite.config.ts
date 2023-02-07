// vite.config.js
import { defineConfig } from 'vite'
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  base: '',
  build: {
    sourcemap: true,
    assetsInlineLimit: 32768
  },
  server: {
    host: true
  },
  plugins: [
    wasm(),
    topLevelAwait()
  ]
});
