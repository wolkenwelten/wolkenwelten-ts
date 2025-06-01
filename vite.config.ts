import { defineConfig } from 'vite'

export default defineConfig({
  base: '',
  build: {
    sourcemap: true,
    assetsInlineLimit: 32768,
  },
  server: {
    host: true,
    proxy: {
      '/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    }
  },
});
