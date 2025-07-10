import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import theme from './theme/theme.js'
import './index.css'

/**
 * SceneForge 앱의 진입점
 * React 앱을 DOM에 마운트하고 필요한 프로바이더들을 설정
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  // React Strict Mode로 개발 시 잠재적 문제 감지
  <React.StrictMode>
    {/* SPA 라우팅을 위한 Browser Router */}
    <BrowserRouter>
      {/* Material-UI 테마 프로바이더 */}
      <ThemeProvider theme={theme}>
        {/* CSS 기본 스타일 리셋 */}
        <CssBaseline />
        {/* 메인 앱 컴포넌트 */}
        <App />
        {/* 토스트 알림 컴포넌트 */}
        <Toaster position="top-right" />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
) 