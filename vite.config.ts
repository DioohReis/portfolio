import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // O Three.js sozinho tem ~600 kB (≈ 170 kB comprimido); o aviso padrão de 500 kB não ajuda aqui.
    chunkSizeWarningLimit: 900,
  },
})
