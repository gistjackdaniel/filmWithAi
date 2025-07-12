import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vite 설정 파일
 * SceneForge 프로젝트의 개발 서버 및 빌드 설정
 */
export default defineConfig({
  // React 플러그인 활성화
  plugins: [react()],
  
  // 개발 서버 설정
  server: {
    port: 3000, // 개발 서버 포트를 3000으로 설정
    host: true, // 모든 네트워크 인터페이스에서 접근 가능
    proxy: {
      // API 요청을 백엔드 서버로 프록시
      '/api': {
        target: 'http://localhost:5000', // 백엔드 서버 주소
        changeOrigin: true, // CORS 이슈 해결을 위한 Origin 변경
        secure: false, // HTTPS 검증 비활성화 (개발 환경)
      },
    },
  },
}) 