// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  base: '',
  build: {
    sourcemap: true,
    assetsInlineLimit: 32768
  },
  plugins: [
    {
      name: "configure-response-headers",
      configureServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
          res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
          next();
        });
      },
    },
  ]
});
