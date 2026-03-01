import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/musical-caterpillar/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'd3': ['d3'],
        }
      }
    }
  }
})
