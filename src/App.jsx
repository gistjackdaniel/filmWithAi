import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { Toaster } from 'react-hot-toast'
import theme from './theme/theme'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import ProjectPage from './pages/ProjectPage'
import StoryGenerationPage from './pages/StoryGenerationPage' // 스토리 생성 페이지 추가
import DirectStoryPage from './pages/DirectStoryPage' // 직접 스토리 작성 페이지 추가
import ProtectedRoute from './components/ProtectedRoute'
import JsonParserTest from './pages/JsonParserTest' // JSON 파싱 테스트 페이지 추가
import SimpleTest from './pages/SimpleTest' // 간단한 테스트 페이지 추가

/**
 * 메인 App 컴포넌트
 * 라우팅 설정과 전역 테마를 관리하는 최상위 컴포넌트
 */
function App() {
  return (
    <>
      {/* 라우팅 설정 */}
      <Routes>
        {/* 공개 라우트 */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* 테스트 페이지들 (개발용) */}
        <Route path="/test-parser" element={<JsonParserTest />} />
        <Route path="/simple-test" element={<SimpleTest />} />
        
        {/* 보호된 라우트 */}
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
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
        <Route path="/project/:projectId" element={
          <ProtectedRoute>
            <ProjectPage />
          </ProtectedRoute>
        } />
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
    </>
  )
}

export default App 