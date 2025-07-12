import { createTheme } from '@mui/material/styles'

/**
 * SceneForge Design System 기반 Material-UI 테마
 * Design System의 색상, 타이포그래피, 컴포넌트 스타일을 적용
 */
const theme = createTheme({
  // 색상 팔레트 설정
  palette: {
    mode: 'dark', // 다크 테마 기본
    primary: {
      main: '#3498DB', // 밝은 블루 (기존 #2E3A59에서 변경)
      light: '#5DADE2', // 더 밝은 블루
      dark: '#2980B9', // 더 어두운 블루
      contrastText: '#F5F5F5',
    },
    secondary: {
      main: '#D4AF37', // Cinematic Gold
      light: '#E6C866',
      dark: '#B8941F',
      contrastText: '#1B1B1E',
    },
    background: {
      default: '#1B1B1E', // Charcoal Black
      paper: '#2F2F37', // Slate Gray
    },
    text: {
      primary: '#F5F5F5', // Ivory White
      secondary: '#A0A3B1', // Cool Gray
    },
    success: {
      main: '#2ECC71', // Emerald Green
      light: '#58D68D',
      dark: '#27AE60',
    },
    error: {
      main: '#E74C3C', // Cinematic Red
      light: '#EC7063',
      dark: '#C0392B',
    },
    warning: {
      main: '#F39C12',
      light: '#F7DC6F',
      dark: '#D68910',
    },
    info: {
      main: '#3498DB',
      light: '#5DADE2',
      dark: '#2980B9',
    },
  },

  // 타이포그래피 설정
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    
    // Design System 타이포그래피 적용
    h1: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '24px',
      fontWeight: 700,
      lineHeight: '32px',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '20px',
      fontWeight: 500,
      lineHeight: '28px',
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '18px',
      fontWeight: 500,
      lineHeight: '24px',
    },
    h4: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px',
      fontWeight: 500,
      lineHeight: '24px',
    },
    h5: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      fontWeight: 500,
      lineHeight: '20px',
    },
    h6: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      fontWeight: 500,
      lineHeight: '16px',
    },
    body1: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: '24px',
    },
    body2: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      fontWeight: 400,
      lineHeight: '20px',
    },
    button: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      fontWeight: 500,
      lineHeight: '20px',
      textTransform: 'none', // 대문자 변환 비활성화
    },
    caption: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      fontWeight: 400,
      lineHeight: '16px',
    },
  },

  // 컴포넌트 스타일 오버라이드
  components: {
    // AppBar 스타일
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#2E3A59',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        },
      },
    },

    // Button 스타일
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '12px 20px',
          textTransform: 'none',
          fontWeight: 500,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          },
        },
        contained: {
          backgroundColor: '#2E3A59',
          color: '#F5F5F5',
          '&:hover': {
            backgroundColor: '#D4AF37',
            color: '#1B1B1E',
          },
        },
        outlined: {
          borderColor: '#444',
          color: '#F5F5F5',
          '&:hover': {
            borderColor: '#D4AF37',
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
          },
        },
      },
    },

    // TextField 스타일
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#1B1B1E',
            color: '#F5F5F5',
            '& fieldset': {
              borderColor: '#444',
            },
            '&:hover fieldset': {
              borderColor: '#D4AF37',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#D4AF37',
            },
          },
          '& .MuiInputBase-input': {
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
          },
          '& .MuiFormHelperText-root': {
            color: '#E74C3C',
          },
        },
      },
    },

    // Card 스타일
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#2F2F37',
          borderRadius: '12px',
          border: '1px solid #444',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },

    // Chip 스타일
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
        },
        filled: {
          backgroundColor: '#D4AF37',
          color: '#1B1B1E',
          '&.MuiChip-colorSuccess': {
            backgroundColor: '#2ECC71',
            color: '#1B1B1E',
          },
        },
        outlined: {
          borderColor: '#444',
          color: '#A0A3B1',
        },
      },
    },

    // IconButton 스타일
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#A0A3B1',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            color: '#D4AF37',
          },
        },
      },
    },

    // CircularProgress 스타일
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: '#D4AF37',
        },
      },
    },
  },

  // 스페이싱 설정
  spacing: 8,

  // 그림자 설정
  shadows: [
    'none',
    '0 2px 4px rgba(0, 0, 0, 0.1)',
    '0 4px 8px rgba(0, 0, 0, 0.1)',
    '0 8px 16px rgba(0, 0, 0, 0.1)',
    '0 16px 32px rgba(0, 0, 0, 0.1)',
    ...Array(20).fill('none'),
  ],

  // 모양 설정
  shape: {
    borderRadius: 8,
  },
})

export default theme 