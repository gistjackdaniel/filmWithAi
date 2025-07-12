import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import SplashScreen from './components/SplashScreen'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import ProjectPage from './pages/ProjectPage'
import StoryGenerationPage from './pages/StoryGenerationPage'
import DirectStoryPage from './pages/DirectStoryPage'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import DebugPanel from './components/DebugPanel'

/**
 * SceneForge 메인 앱 컴포넌트
 * 인증 상태에 따라 적절한 페이지를 렌더링하고 라우팅을 관리
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
        
        {/* 스토리 생성 페이지 라우트 */}
        <Route 
          path="/story-generation" 
          element={
            <ProtectedRoute>
              <StoryGenerationPage />
            </ProtectedRoute>
          } 
        />
        
        {/* 프로젝트 상세 페이지 라우트 */}
        <Route 
          path="/project/:projectId" 
          element={
            <ProtectedRoute>
              <ProjectPage />
            </ProtectedRoute>
          } 
        />
        
        {/* 직접 스토리 생성 페이지 라우트 */}
        <Route 
          path="/direct-story" 
          element={
            <ProtectedRoute>
              <DirectStoryPage />
            </ProtectedRoute>
          } 
        />
      </Routes>

      {/* 개발자 디버그 패널 */}
      <DebugPanel />
    </ErrorBoundary>
  )
}

export default App 