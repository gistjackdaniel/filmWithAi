import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import LoginPage from '../auth/pages/LoginPage';
import GoogleCallback from '../auth/components/GoogleCallback';
import Dashboard from '../dashboard/pages/Dashboard';
import ProjectPage from '../project/pages/ProjectPage';
import SceneDetailPage from '../scene/pages/SceneDetailPage';
import SceneDraftDetailPage from '../scene/pages/SceneDraftDetailPage';
import CutDetailPage from '../cut/pages/CutDetailPage';
import CutDraftDetailPage from '../cut/pages/CutDraftDetailPage';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import ErrorBoundary from '../shared/components/ErrorBoundary';
import { useAuthStore } from '../auth/stores/authStore';
import { ROUTES } from '../shared/constants/routes';
import createAppTheme from '../shared/theme/theme';
import './App.css';

const App: React.FC = () => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error, 
    logout,
    initializeAuth 
  } = useAuthStore();

  // 앱 초기화 시 인증 상태 확인
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // 다크 테마 생성
  const theme = createAppTheme('dark');

  // 로딩 중일 때 스피너 표시
  if (isLoading) {
    return <LoadingSpinner message="인증 상태를 확인하는 중..." />;
  }

  // 에러가 있을 때 에러 메시지 표시
  if (error) {
  return (
      <div className="error-container">
        <h2>오류가 발생했습니다</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          페이지 새로고침
        </button>
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Routes>
            {/* Google OAuth 콜백 라우트 */}
            <Route path={ROUTES.AUTH_CALLBACK} element={<GoogleCallback />} />
            
            {/* 루트 경로에서도 Google OAuth 콜백 처리 */}
            <Route path="/" element={<GoogleCallback />} />
            
            {/* 대시보드 라우트 */}
            <Route 
              path={ROUTES.DASHBOARD} 
              element={
                isAuthenticated ? (
                    <Dashboard />
                ) : (
                  <Navigate to={ROUTES.LOGIN} replace />
                )
              } 
            />
            
            {/* 프로젝트 상세 페이지 라우트 */}
            <Route 
              path={`${ROUTES.PROJECT}/:projectId`} 
              element={
                isAuthenticated ? (
                  <ProjectPage />
                ) : (
                  <Navigate to={ROUTES.LOGIN} replace />
                )
              } 
            />
            
            {/* 씬 상세 페이지 라우트 */}
            <Route 
              path={`${ROUTES.PROJECT}/:projectId/scene/:sceneId`} 
              element={
                isAuthenticated ? (
                  <SceneDetailPage />
                ) : (
                  <Navigate to={ROUTES.LOGIN} replace />
                )
              } 
            />
            
            {/* 씬 draft 상세 페이지 라우트 */}
            <Route 
              path={`${ROUTES.PROJECT}/:projectId/scene-draft/:sceneId`} 
              element={
                isAuthenticated ? (
                  <SceneDraftDetailPage />
                ) : (
                  <Navigate to={ROUTES.LOGIN} replace />
                )
              } 
            />
            
            {/* 컷 상세 페이지 라우트 */}
            <Route 
              path={`${ROUTES.PROJECT}/:projectId/scene/:sceneId/cut/:cutId`} 
              element={
                  <CutDetailPage />
              } 
            />
            
            {/* 컷 draft 상세 페이지 라우트 */}
            <Route 
              path={`${ROUTES.PROJECT}/:projectId/scene/:sceneId/cut-draft/:cutId`} 
              element={
                  <CutDraftDetailPage />
              } 
            />
            
            {/* 로그인 라우트 */}
            <Route 
              path={ROUTES.LOGIN} 
              element={
                isAuthenticated ? (
                  <Navigate to={ROUTES.DASHBOARD} replace />
                ) : (
                  <LoginPage />
                )
              } 
            />
            
            {/* 기본 리다이렉트 */}
            <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
