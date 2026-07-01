import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Em produção (npm run build, usado pelo GitHub Pages) o app fica em
// https://eduardopadams.github.io/Supermix-Granulometria/, então precisa
// do base abaixo. Em desenvolvimento (npm run dev) usamos '/' para poder
// abrir em http://localhost:5173/ sem precisar digitar o subcaminho.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Supermix-Granulometria/' : '/',
  plugins: [react()],
}))
