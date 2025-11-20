import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // tailwindcss(), // もしv4プラグインを使っているなら
  ],
  base: '/my-learning-canvas/', 
})