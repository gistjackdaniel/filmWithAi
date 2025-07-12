import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './stores/authStore'
import theme from './theme/theme'

// 페이지 컴포넌트들
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import ProjectPage from './pages/ProjectPage'
import StoryGenerationPage from './pages/StoryGenerationPage' // 스토리 생성 페이지
import DirectStoryPage from './pages/DirectStoryPage' // 직접 스토리 작성 페이지
import JsonParserTest from './pages/JsonParserTest' // JSON 파싱 테스트 페이지
import SimpleTest from './pages/SimpleTest' // 간단한 테스트 페이지

// 공통 컴포넌트들
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import DebugPanel from './components/DebugPanel'
import SplashScreen from './components/SplashScreen'

/**
 * SceneForge 통합 메인 앱 컴포넌트
 * 스토리 생성, 타임라인 시각화, 인증 시스템을 모두 포함한 완전한 영화 제작 도구
 */
function App() {
  // Zustand 스토어에서 인증 상태 가져오기
  const { isAuthenticated, loading, initialize } = useAuthStore()

  // 앱 초기화 (인증 상태 확인)
  useEffect(() => {
    initialize()
  }, [initialize])

  // 로딩 중일 때 스플래시 화면 표시
  if (loading) {
    return <SplashScreen />
  }

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        
        {/* 라우팅 설정 */}
        <Routes>
          {/* 메인 라우트 - 인증 상태에 따라 대시보드 또는 로그인 페이지 표시 */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                // 인증된 사용자: 보호된 대시보드 표시
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              ) : (
                // 미인증 사용자: 로그인 페이지 표시
                <LoginPage />
              )
            } 
          />
          
          {/* 스토리 생성 관련 라우트들 */}
          <Route path="/story-generation" element={
            <ProtectedRoute>
              <StoryGenerationPage />
            </ProtectedRoute>
          } />
          <Route path="/direct-story" element={
            <ProtectedRoute>
              <DirectStoryPage />
            </ProtectedRoute>
          } />
          
          {/* 프로젝트 상세 페이지 라우트 */}
          <Route path="/project/:projectId" element={
            <ProtectedRoute>
              <ProjectPage />
            </ProtectedRoute>
          } />
          
          {/* 테스트 페이지들 (개발용) */}
          <Route path="/test-parser" element={<JsonParserTest />} />
          <Route path="/simple-test" element={<SimpleTest />} />
        </Routes>
        
        {/* 전역 토스트 알림 */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--color-card-bg)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
            },
          }}
        />

        {/* 개발자 디버그 패널 */}
        <DebugPanel />
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App 