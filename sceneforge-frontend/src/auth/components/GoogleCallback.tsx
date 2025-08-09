import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const GoogleCallback: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // URL에서 authorization code 추출
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    // Google OAuth 콜백이 아닌 경우 대시보드로 리다이렉트
    if (!code && !error) {
      if (isAuthenticated) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
      return;
    }

    if (error) {
      // 에러가 있는 경우 부모 창에 에러 메시지 전송
      window.opener?.postMessage({
        type: 'GOOGLE_AUTH_ERROR',
        error: error
      }, window.location.origin);
    } else if (code) {
      // 성공한 경우 부모 창에 authorization code 전송
      window.opener?.postMessage({
        type: 'GOOGLE_AUTH_SUCCESS',
        code: code
      }, window.location.origin);
    } else {
      // code가 없는 경우 에러 처리
      window.opener?.postMessage({
        type: 'GOOGLE_AUTH_ERROR',
        error: 'Authorization code를 받지 못했습니다.'
      }, window.location.origin);
    }

    // 팝업 창 닫기
    window.close();
  }, [navigate, isAuthenticated]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2>로그인 처리 중...</h2>
        <p>잠시만 기다려주세요.</p>
      </div>
    </div>
  );
};

export default GoogleCallback; 