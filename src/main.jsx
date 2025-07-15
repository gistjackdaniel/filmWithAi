import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Toaster } from 'react-hot-toast'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'
import createAppTheme from './theme/theme.js'
import './index.css'
import SchedulerTestPage from './pages/SchedulerTestPage';

/**
 * SceneForge 앱의 진입점
 * React 앱을 DOM에 마운트하고 필요한 프로바이더들을 설정
 * designSystem.txt 기준으로 다크 테마 적용
 */

// 다크 모드 테마 생성
const darkTheme = createAppTheme('dark')

ReactDOM.createRoot(document.getElementById('root')).render(
  // React Strict Mode로 개발 시 잠재적 문제 감지
  <React.StrictMode>
    {/* Google OAuth 프로바이더 */}
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "your_google_client_id_here"}>
      {/* SPA 라우팅을 위한 Browser Router */}
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <ThemeProvider theme={darkTheme}>
          {/* CSS 기본 스타일 리셋 */}
          <CssBaseline />
          {/* 메인 앱 컴포넌트 */}
          <App />
          {/* 토스트 알림 컴포넌트 */}
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#2F2F37',
                color: '#F5F5F5',
                border: '1px solid #444'
              }
            }}
          />
        </ThemeProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>,
) 