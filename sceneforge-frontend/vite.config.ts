import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002, // 프론트엔드는 3002 포트 사용
    host: true,
    allowedHosts: [
      'filmaiforge.com',
      'www.filmaiforge.com',
      'api.filmaiforge.com'
    ],
  },
})
