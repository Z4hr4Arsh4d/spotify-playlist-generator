import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Pin the dev server to 127.0.0.1:5173 so the Spotify redirect always matches.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true, // fail loudly instead of silently using 5174/5175
  },
})