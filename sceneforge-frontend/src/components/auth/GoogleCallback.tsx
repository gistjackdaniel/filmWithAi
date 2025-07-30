import React, { useEffect } from 'react';

const GoogleCallback: React.FC = () => {
  useEffect(() => {
    // URL에서 액세스 토큰 추출
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = urlParams.get('access_token');
    const error = urlParams.get('error');

    if (error) {
      // 에러가 있는 경우 부모 창에 에러 메시지 전송
      window.opener?.postMessage({
        type: 'GOOGLE_AUTH_ERROR',
        error: error
      }, window.location.origin);
    } else if (accessToken) {
      // 성공한 경우 부모 창에 토큰 전송
      window.opener?.postMessage({
        type: 'GOOGLE_AUTH_SUCCESS',
        accessToken: accessToken
      }, window.location.origin);
    } else {
      // 토큰이 없는 경우 에러 처리
      window.opener?.postMessage({
        type: 'GOOGLE_AUTH_ERROR',
        error: '액세스 토큰을 받지 못했습니다.'
      }, window.location.origin);
    }

    // 팝업 창 닫기
    window.close();
  }, []);

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