import { defineConfig } from 'vite'
import { resolve } from 'path';
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'html2canvas': resolve(__dirname, 'node_modules/html2canvas-pro'),
    },
  },
})
