import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './components/auth/LoginForm';
import GoogleCallback from './components/auth/GoogleCallback';
import Dashboard from './components/dashboard/Dashboard';
import ProjectPage from './pages/ProjectPage';
import SceneDetailPage from './pages/SceneDetailPage';
import SceneDraftDetailPage from './pages/SceneDraftDetailPage';
import CutDetailPage from './pages/CutDetailPage';
import CutDraftDetailPage from './pages/CutDraftDetailPage';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import { useAuthStore } from './stores/authStore';
import { ROUTES } from './constants/routes';
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
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Routes>
            {/* Google OAuth 콜백 라우트 */}
            <Route path={ROUTES.AUTH_CALLBACK} element={<GoogleCallback />} />
            
            {/* 대시보드 라우트 */}
            <Route 
              path={ROUTES.DASHBOARD} 
              element={
                isAuthenticated ? (
                  <Dashboard user={user!} onLogout={logout} />
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
                isAuthenticated ? (
                  <CutDetailPage />
                ) : (
                  <Navigate to={ROUTES.LOGIN} replace />
                )
              } 
            />
            
            {/* 컷 draft 상세 페이지 라우트 */}
            <Route 
              path={`${ROUTES.PROJECT}/:projectId/scene/:sceneId/cut-draft/:cutId`} 
              element={
                isAuthenticated ? (
                  <CutDraftDetailPage />
                ) : (
                  <Navigate to={ROUTES.LOGIN} replace />
                )
              } 
            />
            
            {/* 로그인 라우트 */}
            <Route 
              path={ROUTES.LOGIN} 
              element={
                isAuthenticated ? (
                  <Navigate to={ROUTES.DASHBOARD} replace />
                ) : (
                  <LoginForm />
                )
              } 
            />
            
            {/* 기본 리다이렉트 */}
            <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
