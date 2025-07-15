import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import SplashScreen from './components/SplashScreen'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import ProjectPage from './pages/ProjectPage'
import ConteGenerationPage from './pages/ConteGenerationPage'
import DirectStoryPage from './pages/DirectStoryPage'
import SchedulerPage from './pages/SchedulerPage'
import SchedulerTestPage from './pages/SchedulerTestPage'
import SimpleSchedulePage from './pages/SimpleSchedulePage'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import DebugPanel from './components/DebugPanel'

/**
 * SceneForge 메인 앱 컴포넌트
 * 인증 상태에 따라 적절한 페이지를 렌더링하고 라우팅을 관리
 * designSystem.txt 기준으로 다크 테마 적용
 */
function App() {
  // Zustand 스토어에서 인증 상태 가져오기
  const { isAuthenticated, loading, initialize } = useAuthStore()

  // 앱 초기화 (인증 상태 확인)
  useEffect(() => {
    initialize()
    
    // 다크 테마를 강제로 설정
    document.documentElement.setAttribute('data-theme', 'dark')
    document.documentElement.style.colorScheme = 'dark'
    
    // body에도 다크 모드 스타일 강제 적용
    document.body.style.backgroundColor = '#1B1B1E'
    document.body.style.color = '#F5F5F5'
    
    // MUI 테마도 다크 모드로 설정
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#1B1B1E')
    }
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
        
        {/* 로그인 페이지 라우트 - 명시적 경로 */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              // 이미 로그인된 사용자는 대시보드로 리다이렉트
              <Navigate to="/" replace />
            ) : (
              // 미인증 사용자: 로그인 페이지 표시
              <LoginPage />
            )
          } 
        />
        
        {/* 프로젝트 기반 라우팅 구조 */}
        {/* 프로젝트 상세 페이지 라우트 */}
        <Route 
          path="/project/:projectId" 
          element={
            <ProtectedRoute>
              <ProjectPage />
            </ProtectedRoute>
          } 
        />
        
        {/* 프로젝트 콘티 생성 페이지 라우트 */}
        <Route 
          path="/project/:projectId/conte" 
          element={
            <ProtectedRoute>
              <ConteGenerationPage />
            </ProtectedRoute>
          } 
        />
        
        {/* 직접 스토리 생성 페이지 라우트 (임시) */}
        <Route 
          path="/direct-story" 
          element={
            <ProtectedRoute>
              <DirectStoryPage />
            </ProtectedRoute>
          } 
        />
        
        {/* 스케줄러 페이지 라우트 */}
        <Route 
          path="/scheduler" 
          element={
            <ProtectedRoute>
              <SchedulerPage />
            </ProtectedRoute>
          } 
        />
        
        {/* 스케줄러 테스트 페이지 라우트 */}
        <Route 
          path="/scheduler-test" 
          element={<SchedulerTestPage />} 
        />
        
        {/* 간단한 스케줄 페이지 라우트 */}
        <Route 
          path="/simple-schedule" 
          element={
            <ProtectedRoute>
              <SimpleSchedulePage />
            </ProtectedRoute>
          } 
        />
        
        {/* 프로젝트별 스케줄 페이지 라우트 */}
        <Route 
          path="/schedule/:projectId" 
          element={
            <ProtectedRoute>
              <SimpleSchedulePage />
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