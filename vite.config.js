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
      // ERP backend (Flask/Supabase, :5001) — ต้องมาก่อน '/api' เพื่อให้ match ก่อน
      '/api/erp': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      // Node proxy (:5000) — /api/analyze และอื่น ๆ
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
