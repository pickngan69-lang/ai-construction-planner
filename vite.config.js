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
      // Node backend (:5000) — /api/analyze, /api/auth, /api/billing, /api/erp
      // ERP material prices now live in the Node server (server/erp/), so all
      // /api/* traffic goes to :5000. (No separate Flask service needed.)
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
