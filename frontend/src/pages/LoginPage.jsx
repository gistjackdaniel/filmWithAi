import { useState, useEffect } from 'react'
import { 
  Box, 
  Button, 
  Typography, 
  Container, 
  Paper,
  CircularProgress
} from '@mui/material'
import { Google } from '@mui/icons-material'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'
import ErrorMessage from '../components/error/ErrorMessage'

/**
 * 로그인 페이지 컴포넌트
 * Google OAuth 2.0을 사용한 사용자 인증 페이지
 * 인증되지 않은 사용자가 앱에 접근할 때 표시됨
 */
const LoginPage = () => {
  // 로컬 상태 관리
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Zustand 스토어에서 로그인 함수 가져오기
  const { login } = useAuthStore()

  /**
   * Google OAuth 로그인 설정
   * react-oauth/google 라이브러리를 사용한 Google 로그인
   * access token을 직접 받아서 서버에 전송
   */
  const googleLogin = useGoogleLogin({
    // 리디렉션 URI 명시적 설정
    redirect_uri: import.meta.env.VITE_REDIRECT_URI || 'http://localhost:3002',
    // access token을 직접 받기 위한 설정
    onSuccess: async (response) => {
      try {
        setIsLoading(true)
        setError(null) // 에러 상태 초기화
        
        // 디버깅: Google OAuth 응답 구조 확인
        console.log('Google OAuth Response:', response)
        
        // 서버에 Google access_token을 JSON 객체로 전송하여 JWT 토큰 받기
        const result = await login({ access_token: response.access_token })
        
        if (result.success) {
          toast.success('로그인 성공! 환영합니다! 🎬')
        } else {
          setError(new Error(result.error || '로그인에 실패했습니다.'))
        }
      } catch (error) {
        console.error('Login error:', error)
        setError(error)
      } finally {
        setIsLoading(false)
      }
    },
    // 로그인 실패 시 콜백
    onError: (error) => {
      console.error('Google OAuth Error:', error)
      setError(new Error('Google 로그인에 실패했습니다. 다시 시도해주세요.'))
      setIsLoading(false)
    }
  })

  /**
   * 재시도 핸들러
   */
  const handleRetry = () => {
    setError(null)
    googleLogin()
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #1B1B1E 0%, #2E3A59 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 배경 장식 요소 */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%)',
            zIndex: 0,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -100,
            left: -100,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(46, 58, 89, 0.1) 0%, transparent 70%)',
            zIndex: 0,
          }}
        />

        {/* 로그인 카드 */}
        <Paper
          elevation={8}
          sx={{
            p: { xs: 3, sm: 4 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: 450,
            width: '100%',
            background: 'rgba(47, 47, 55, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* 로고 영역 */}
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography 
              variant="h2" 
              component="h1" 
              gutterBottom
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #D4AF37, #E6C866)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              SceneForge
            </Typography>
            
            <Typography 
              variant="h6" 
              color="text.secondary" 
              gutterBottom
              sx={{ fontWeight: 500 }}
            >
              🎬 AI 영화 제작 타임라인 툴
            </Typography>
          </Box>
          
          {/* 에러 메시지 */}
          {error && (
            <Box sx={{ mb: 3, width: '100%' }}>
              <ErrorMessage
                error={error}
                onRetry={handleRetry}
                onClose={() => setError(null)}
                show={!!error}
              />
            </Box>
          )}

          {/* 기능 설명 */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ 
                mb: 2,
                lineHeight: 1.6,
                maxWidth: 300,
              }}
            >
              시놉시스 → AI 스토리 → 콘티 → 타임라인 시각화
            </Typography>
            
            {/* 기능 아이콘들 */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                ✍️ 시놉시스 작성
              </Typography>
              <Typography variant="body2" color="text.secondary">
                🤖 AI 스토리 생성
              </Typography>
              <Typography variant="body2" color="text.secondary">
                🎬 콘티 자동화
              </Typography>
            </Box>
          </Box>

          {/* Google 로그인 버튼 */}
          <Button
            variant="contained"
            size="large"
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Google />}
            onClick={() => googleLogin()}
            disabled={isLoading}
            aria-label={isLoading ? '로그인 처리 중입니다' : 'Google 계정으로 로그인'}
            aria-describedby="login-description"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                googleLogin()
              }
            }}
            sx={{
              width: '100%',
              py: 2,
              fontSize: '1.1rem',
              fontWeight: 600,
              background: 'linear-gradient(45deg, #D4AF37, #E6C866)',
              color: '#1B1B1E',
              border: 'none',
              '&:hover': {
                background: 'linear-gradient(45deg, #E6C866, #D4AF37)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(212, 175, 55, 0.3)',
              },
              '&:disabled': {
                background: 'rgba(212, 175, 55, 0.3)',
                color: 'rgba(27, 27, 30, 0.5)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            {isLoading ? '로그인 중...' : 'Google로 로그인'}
          </Button>
          
          {/* 스크린 리더용 설명 */}
          <div id="login-description" style={{ display: 'none' }}>
            Google 계정을 사용하여 SceneForge에 로그인합니다. 
            로그인 후 영화 프로젝트를 생성하고 관리할 수 있습니다.
          </div>

          {/* 추가 정보 */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              🔐 Google 계정으로 안전한 로그인
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              💾 프로젝트 자동 저장 및 동기화
            </Typography>
            <Typography variant="body2" color="text.secondary">
              🚀 무료로 시작하세요
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default LoginPage 