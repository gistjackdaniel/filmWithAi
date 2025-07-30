import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import './LoginForm.css';

const LoginForm: React.FC = () => {
  const { 
    isLoading, 
    error, 
    loginWithGoogle, 
    loginWithTest, 
    setError 
  } = useAuthStore();

  const handleGoogleLogin = async () => {
    try {
      // Google OAuth 팝업 열기
      const redirectUri = window.location.origin + '/auth/google/callback';
      console.log('Redirect URI:', redirectUri); // 디버깅용 로그
      
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=token&` +
        `scope=email profile&` +
        `state=${Math.random().toString(36).substring(7)}`;

      const popup = window.open(googleAuthUrl, 'googleAuth', 
        'width=500,height=600,scrollbars=yes,resizable=yes');

      if (!popup) {
        throw new Error('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
      }

      // 팝업에서 토큰을 받기 위한 이벤트 리스너
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          const { accessToken } = event.data;
          
          try {
            await loginWithGoogle(accessToken);
            popup.close();
            window.removeEventListener('message', handleMessage);
          } catch (loginError: any) {
            setError(loginError.response?.data?.message || '로그인에 실패했습니다.');
            popup.close();
            window.removeEventListener('message', handleMessage);
          }
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          setError(event.data.error || 'Google 로그인에 실패했습니다.');
          popup.close();
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);

      // 팝업이 닫힌 경우 처리
      const checkClosed = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
          }
        } catch (error) {
          // Cross-Origin-Opener-Policy로 인한 접근 제한 시 처리
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
        }
      }, 1000);

    } catch (error: any) {
      setError(error.message || '로그인 중 오류가 발생했습니다.');
    }
  };

  const handleTestLogin = async () => {
    try {
      await loginWithTest();
    } catch (error: any) {
      setError(error.response?.data?.message || '테스트 로그인에 실패했습니다.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>SceneForge</h1>
          <p>영화 제작을 위한 AI 기반 프로젝트 관리 플랫폼</p>
        </div>

        <div className="login-form">
          <button
            className="google-login-btn"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <span>로그인 중...</span>
            ) : (
              <>
                <svg className="google-icon" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google로 로그인
              </>
            )}
          </button>

          {import.meta.env.DEV && (
            <button
              className="test-login-btn"
              onClick={handleTestLogin}
              disabled={isLoading}
            >
              테스트 로그인 (개발용)
            </button>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        <div className="login-footer">
          <p>SceneForge는 영화 제작팀을 위한 AI 기반 프로젝트 관리 플랫폼입니다.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm; 