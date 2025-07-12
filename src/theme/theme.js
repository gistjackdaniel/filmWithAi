import { createTheme } from '@mui/material/styles'

/**
 * SceneForge Material-UI 테마 설정
 * 앱 전체의 일관된 디자인 시스템을 정의
 */

// 다크 테마 색상 팔레트
const darkPalette = {
  mode: 'dark',
  // 주요 색상 (Deep Slate Blue)
  primary: {
    main: '#2E3A59', // Deep Slate Blue
    light: '#4A5A7A', // 밝은 버전
    dark: '#1E2A3A', // 어두운 버전
  },
  // 보조 색상 (Cinematic Gold)
  secondary: {
    main: '#D4AF37', // Cinematic Gold
    light: '#E6C866', // 밝은 골드
    dark: '#B8941F', // 어두운 골드
  },
  // 배경 색상 (Charcoal Black)
  background: {
    default: '#1B1B1E', // Charcoal Black
    paper: '#2F2F37', // Slate Gray (카드 배경)
  },
  // 텍스트 색상
  text: {
    primary: '#F5F5F5', // Ivory White
    secondary: '#A0A3B1', // Cool Gray
  },
  // 성공/경고 색상
  success: {
    main: '#2ECC71', // Emerald Green
  },
  error: {
    main: '#E74C3C', // Cinematic Red
  },
}

// 라이트 테마 색상 팔레트
const lightPalette = {
  mode: 'light',
  // 주요 색상 (Deep Slate Blue)
  primary: {
    main: '#2E3A59', // Deep Slate Blue
    light: '#4A5A7A', // 밝은 버전
    dark: '#1E2A3A', // 어두운 버전
  },
  // 보조 색상 (Cinematic Gold)
  secondary: {
    main: '#D4AF37', // Cinematic Gold
    light: '#E6C866', // 밝은 골드
    dark: '#B8941F', // 어두운 골드
  },
  // 배경 색상 (Light)
  background: {
    default: '#FFFFFF', // White
    paper: '#F8F9FA', // Light Gray
  },
  // 텍스트 색상
  text: {
    primary: '#1B1B1E', // Dark Gray
    secondary: '#6C6F7C', // Medium Gray
  },
  // 성공/경고 색상
  success: {
    main: '#2ECC71', // Emerald Green
  },
  error: {
    main: '#E74C3C', // Cinematic Red
  },
}

/**
 * 테마 생성 함수
 * @param {string} mode - 'dark' 또는 'light'
 * @returns {Object} Material-UI 테마 객체
 */
const createAppTheme = (mode = 'dark') => {
  const palette = mode === 'dark' ? darkPalette : lightPalette

  return createTheme({
    // ===== 색상 팔레트 =====
    palette,
    
    // ===== 타이포그래피 =====
    typography: {
      // Inter 폰트 스택 (Google Fonts)
      fontFamily: [
        'Inter', // Google Fonts Inter
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
            fontWeight: 500,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)',
            },
          },
          contained: {
            background: 'linear-gradient(45deg, #D4AF37, #E6C866)',
            color: '#1B1B1E',
            '&:hover': {
              background: 'linear-gradient(45deg, #E6C866, #D4AF37)',
            },
          },
        },
      },
      // 카드 컴포넌트 커스터마이징
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12, // 더 둥근 모서리
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)', // 부드러운 그림자
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            },
          },
        },
      },
      // 텍스트 필드 컴포넌트 커스터마이징
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              '& fieldset': {
                borderColor: 'rgba(212, 175, 55, 0.3)',
              },
              '&:hover fieldset': {
                borderColor: '#D4AF37',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#D4AF37',
              },
            },
            '& .MuiInputLabel-root': {
              '&.Mui-focused': {
                color: '#D4AF37',
              },
            },
          },
        },
      },
      // 다이얼로그 컴포넌트 커스터마이징
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            background: mode === 'dark' ? 'rgba(47, 47, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
          },
        },
      },
      // 메뉴 컴포넌트 커스터마이징
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            background: mode === 'dark' ? '#2F2F37' : '#FFFFFF',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
          },
        },
      },
      // 아바타 컴포넌트 커스터마이징
      MuiAvatar: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            border: '2px solid transparent',
            transition: 'all 0.3s ease',
            '&:hover': {
              border: '2px solid #D4AF37',
              transform: 'scale(1.05)',
            },
          },
        },
      },
      // 앱바 컴포넌트 커스터마이징
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: mode === 'dark' ? 'rgba(47, 47, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
          },
        },
      },
    },
  })
}

// 기본 테마 (다크 테마)
const theme = createAppTheme('dark')

export default theme
export { createAppTheme } 