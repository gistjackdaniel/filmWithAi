import { Box, CircularProgress, Typography } from '@mui/material'
import { Movie } from '@mui/icons-material'

/**
 * 스플래시 화면 컴포넌트
 * 앱 초기 로딩 시 표시되는 로딩 화면
 * 인증 상태 확인 중에 사용자에게 시각적 피드백 제공
 */
const SplashScreen = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column', // 세로 배치
        alignItems: 'center', // 가로 중앙 정렬
        justifyContent: 'center', // 세로 중앙 정렬
        minHeight: '100vh', // 전체 화면 높이
        bgcolor: 'background.default', // 테마 배경색 사용
      }}
    >
      {/* 영화 아이콘 (큰 크기) */}
      <Movie sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
      
      {/* 앱 제목 */}
      <Typography variant="h3" component="h1" gutterBottom>
        SceneForge
      </Typography>
      
      {/* 앱 설명 */}
      <Typography variant="h6" color="text.secondary" gutterBottom>
        AI 영화 제작 타임라인 툴
      </Typography>
      
      {/* 로딩 스피너 */}
      <CircularProgress sx={{ mt: 4 }} />
    </Box>
  )
}

export default SplashScreen 