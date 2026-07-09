import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base muda por modo, não mais por branch: build de produção serve dentro do
// Django (/static/frontend/), dev server roda solto na raiz (/).
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/static/frontend/' : '/',
}))
