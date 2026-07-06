import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The Anthropic key now lives only on the Express backend (server.js).
// In dev, run `node server.js` alongside `npm run dev` — Vite proxies /api/*
// to it so the frontend never talks to Anthropic (or holds the key) directly.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
