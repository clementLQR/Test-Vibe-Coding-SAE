/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // In Docker the app is reached through nginx on HTTP_PORT (8080 by default)
    hmr: { clientPort: Number(process.env.HTTP_PORT ?? 8080) },
    // In Docker on Windows, file changes on the shared folder send no events: poll instead
    watch: process.env.VITE_USE_POLLING === 'true' ? { usePolling: true, interval: 300 } : undefined,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
