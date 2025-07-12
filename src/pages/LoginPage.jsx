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
import useAuthStore from '../stores/authStore'
import toast from 'react-hot-toast'

/**
 * 로그인 페이지 컴포넌트
 * Google OAuth 2.0을 사용한 사용자 인증 페이지
 * 인증되지 않은 사용자가 앱에 접근할 때 표시됨
 */
const LoginPage = () => {
  // 로컬 로딩 상태 (Google OAuth 처리 중)
  const [isLoading, setIsLoading] = useState(false)
  
  // Zustand 스토어에서 로그인 함수 가져오기
  const { login } = useAuthStore()

  /**
   * Google OAuth 로그인 설정
   * react-oauth/google 라이브러리를 사용한 Google 로그인
   */
  const googleLogin = useGoogleLogin({
    // 로그인 성공 시 콜백
    onSuccess: async (response) => {
      try {
        setIsLoading(true)
        
        // 서버에 Google 인증 코드 전송하여 JWT 토큰 받기
        const result = await login(response.code)
        
        if (result.success) {
          toast.success('로그인 성공!')
        } else {
          toast.error(result.error || '로그인에 실패했습니다.')
        }
      } catch (error) {
        toast.error('로그인 중 오류가 발생했습니다.')
      } finally {
        setIsLoading(false)
      }
    },
    // 로그인 실패 시 콜백
    onError: (error) => {
      console.error('Google OAuth Error:', error)
      toast.error('Google 로그인에 실패했습니다.')
      setIsLoading(false)
    }
  })

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh', // 전체 화면 높이
          textAlign: 'center',
        }}
      >
        {/* 로그인 카드 */}
        <Paper
          elevation={3}
          sx={{
            p: 4, // 패딩
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: 400, // 최대 너비
            width: '100%',
          }}
        >
          {/* 앱 제목 */}
          <Typography variant="h3" component="h1" gutterBottom>
            SceneForge
          </Typography>
          
          {/* 앱 설명 */}
          <Typography variant="h6" color="text.secondary" gutterBottom>
            🎬 AI 영화 제작 타임라인 툴
          </Typography>
          
          {/* 기능 설명 */}
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            시놉시스 → AI 스토리 → 콘티 → 타임라인 시각화
          </Typography>

          {/* Google 로그인 버튼 */}
          <Button
            variant="contained"
            size="large"
            startIcon={isLoading ? <CircularProgress size={20} /> : <Google />}
            onClick={() => googleLogin()}
            disabled={isLoading}
            sx={{
              width: '100%',
              py: 1.5, // 세로 패딩
              fontSize: '1.1rem',
            }}
          >
            {isLoading ? '로그인 중...' : 'Google로 로그인'}
          </Button>

          {/* 추가 정보 */}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            * Google 계정으로 간편 로그인
          </Typography>
          <Typography variant="body2" color="text.secondary">
            * 프로젝트 자동 저장 및 동기화
          </Typography>
        </Paper>
      </Box>
    </Container>
  )
}

export default LoginPage 