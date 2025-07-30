import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

/**
 * Vite 설정 파일
 * SceneForge 프로젝트의 개발 서버 및 빌드 설정
 */
export default defineConfig({
  // React 플러그인 활성화
  plugins: [react()],
  
  // 경로 매핑 설정
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/sceneforge-nestjs': path.resolve(__dirname, '../sceneforge-nestjs/src'),
      '@/backend': path.resolve(__dirname, '../sceneforge-nestjs/src'),
    },
  },
  
  // 개발 서버 설정
  server: {
    port: 3002, // 개발 서버 포트 (항상 3002)
    proxy: {
      // API 요청을 백엔드 서버로 프록시
      '/api': {
        target: 'http://localhost:5001', // 백엔드 서버 주소 (5001로 고정)
        changeOrigin: true, // CORS 이슈 해결을 위한 Origin 변경
      },
    },
  },
  
  // 빌드 최적화 설정
  build: {
    // 번들 크기 최적화
    rollupOptions: {
      output: {
        // 청크 분할 전략
        manualChunks: {
          // React 관련 라이브러리들을 별도 청크로 분리
          'react-vendor': ['react', 'react-dom'],
          // Material-UI 관련 라이브러리들을 별도 청크로 분리
          'mui-vendor': ['@mui/material', '@mui/icons-material'],
          // 상태 관리 라이브러리를 별도 청크로 분리
          'state-vendor': ['zustand'],
          // 유틸리티 라이브러리들을 별도 청크로 분리
          'utils-vendor': ['axios', 'react-hot-toast'],
        },
      },
    },
    // 청크 크기 경고 임계값 설정
    chunkSizeWarningLimit: 1000,
    // 소스맵 생성 (개발 환경에서만)
    sourcemap: process.env.NODE_ENV === 'development',
  },
  
  // 의존성 최적화 설정
  optimizeDeps: {
    // 사전 번들링할 의존성 목록
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@mui/icons-material',
      'zustand',
      'axios',
    ],
  },
}) 