/** @type {import('vite').UserConfig} */
import { fileURLToPath } from 'url';

export default {
  base: '',
  build: {
    target: 'es2022',
    minify: true,
    modulePreload: {
      polyfill: false,
    },
    sourcemap: true,
    assetsInlineLimit: 32768,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        game: fileURLToPath(new URL('./game.html', import.meta.url)),
      },
    },
  },
};
