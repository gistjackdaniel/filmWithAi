import { createTheme } from '@mui/material/styles'

/**
 * SceneForge Material-UI 테마 설정
 * 앱 전체의 일관된 디자인 시스템을 정의
 */
const theme = createTheme({
  // ===== 색상 팔레트 =====
  palette: {
    // 주요 색상 (파란색 계열)
    primary: {
      main: '#1976d2', // 메인 파란색
      light: '#42a5f5', // 밝은 파란색
      dark: '#1565c0', // 어두운 파란색
    },
    // 보조 색상 (빨간색 계열)
    secondary: {
      main: '#dc004e', // 메인 빨간색
      light: '#ff5983', // 밝은 빨간색
      dark: '#9a0036', // 어두운 빨간색
    },
    // 배경 색상
    background: {
      default: '#f5f5f5', // 기본 배경색 (연한 회색)
      paper: '#ffffff', // 카드/페이퍼 배경색 (흰색)
    },
  },
  
  // ===== 타이포그래피 =====
  typography: {
    // 시스템 폰트 스택 (크로스 플랫폼 호환성)
    fontFamily: [
      '-apple-system', // macOS, iOS
      'BlinkMacSystemFont', // macOS
      '"Segoe UI"', // Windows
      'Roboto', // Android, Material Design
      '"Helvetica Neue"', // 폴백
      'Arial', // 최종 폴백
      'sans-serif', // 제네릭 폴백
    ].join(','),
    
    // 제목 스타일 정의
    h1: {
      fontSize: '2.5rem', // 40px
      fontWeight: 600, // Semi-bold
    },
    h2: {
      fontSize: '2rem', // 32px
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem', // 28px
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem', // 24px
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem', // 20px
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem', // 16px
      fontWeight: 600,
    },
  },
  
  // ===== 컴포넌트 스타일 오버라이드 =====
  components: {
    // 버튼 컴포넌트 커스터마이징
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // 대문자 변환 비활성화
          borderRadius: 8, // 둥근 모서리
        },
      },
    },
    // 카드 컴포넌트 커스터마이징
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12, // 더 둥근 모서리
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)', // 부드러운 그림자
        },
      },
    },
  },
})

export default theme 