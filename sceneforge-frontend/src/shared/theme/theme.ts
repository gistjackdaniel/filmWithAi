import { createTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';

/**
 * SceneForge Material-UI 테마 설정
 * 앱 전체의 일관된 디자인 시스템을 정의
 * designSystem.txt 기준으로 업데이트됨
 */

// 다크 테마 색상 팔레트
const darkPalette = {
  mode: 'dark' as const,
  // 주요 색상 (Modern Blue)
  primary: {
    main: '#3498DB', // Modern Blue - 밝고 현대적인 블루, 기술적이고 신뢰감 있는 분위기
    light: '#5DADE2', // 밝은 버전
    dark: '#2E86C1', // 어두운 버전
  },
  // 보조 색상 (Cinematic Gold)
  secondary: {
    main: '#D4AF37', // Cinematic Gold - 고급스럽고 주목도 높은 골드, CTA(버튼, 강조 텍스트)용
    light: '#E6C866', // 밝은 골드
    dark: '#B8941F', // 어두운 골드
  },
  // 배경 색상 (Charcoal Black)
  background: {
    default: '#1B1B1E', // Charcoal Black - 영상과 콘티가 돋보이는 무채색 톤, 집중을 돕는 배경
    paper: '#2F2F37', // Slate Gray - 카드, 패널, 타임라인 등에 쓰기 좋은 중간톤 회색
  },
  // 텍스트 색상
  text: {
    primary: '#F5F5F5', // Ivory White - 부드럽고 따뜻한 흰색, 다크 배경에서 뛰어난 가독성 제공
    secondary: '#A0A3B1', // Cool Gray - 부제목, 설명 텍스트 등 시각적 계층을 위한 색상
  },
  // 성공/경고 색상
  success: {
    main: '#2ECC71', // Emerald Green - 긍정적 메시지, 완료 상태 등을 나타낼 때 사용
  },
  error: {
    main: '#E74C3C', // Cinematic Red - 삭제, 경고 등 눈에 띄는 알림에 적합한 강렬한 붉은색
  },
};

// 라이트 테마 색상 팔레트
const lightPalette = {
  mode: 'light' as const,
  // 주요 색상 (Modern Blue)
  primary: {
    main: '#3498DB', // Modern Blue - 밝고 현대적인 블루, 기술적이고 신뢰감 있는 분위기
    light: '#5DADE2', // 밝은 버전
    dark: '#2E86C1', // 어두운 버전
  },
  // 보조 색상 (Cinematic Gold)
  secondary: {
    main: '#D4AF37', // Cinematic Gold - 고급스럽고 주목도 높은 골드, CTA(버튼, 강조 텍스트)용
    light: '#E6C866', // 밝은 골드
    dark: '#B8941F', // 어두운 골드
  },
  // 배경 색상 (Light)
  background: {
    default: '#FFFFFF', // White
    paper: '#F0F0F0', // Light Gray
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
};

/**
 * 앱 테마 생성 함수
 * @param mode - 'dark' 또는 'light'
 * @returns Material-UI 테마 객체
 */
const createAppTheme = (mode: 'dark' | 'light' = 'dark'): Theme => {
  return createTheme({
    // 색상 팔레트 설정
    palette: mode === 'dark' ? darkPalette : lightPalette,
    
    // 타이포그래피 설정
    typography: {
      fontFamily: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        'Oxygen',
        'Ubuntu',
        'Cantarell',
        'Fira Sans',
        'Droid Sans',
        'Helvetica Neue',
        'sans-serif'
      ].join(','),
      
      // 제목 스타일
      h1: {
        fontSize: '24px',
        fontWeight: 700,
        lineHeight: '32px',
        color: mode === 'dark' ? '#F5F5F5' : '#1B1B1E',
      },
      h2: {
        fontSize: '20px',
        fontWeight: 500,
        lineHeight: '28px',
        color: mode === 'dark' ? '#F5F5F5' : '#1B1B1E',
      },
      h3: {
        fontSize: '18px',
        fontWeight: 500,
        lineHeight: '24px',
        color: mode === 'dark' ? '#F5F5F5' : '#1B1B1E',
      },
      
      // 본문 텍스트
      body1: {
        fontSize: '16px',
        fontWeight: 400,
        lineHeight: '24px',
        color: mode === 'dark' ? '#F5F5F5' : '#1B1B1E',
      },
      body2: {
        fontSize: '14px',
        fontWeight: 400,
        lineHeight: '20px',
        color: mode === 'dark' ? '#A0A3B1' : '#6C6F7C',
      },
      
      // 버튼 텍스트
      button: {
        fontSize: '14px',
        fontWeight: 500,
        lineHeight: '20px',
        textTransform: 'none',
      },
      
      // 캡션 텍스트
      caption: {
        fontSize: '12px',
        fontWeight: 400,
        lineHeight: '16px',
        color: mode === 'dark' ? '#A0A3B1' : '#6C6F7C',
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
              boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)', // Modern Blue 그림자
            },
          },
          contained: {
            background: 'linear-gradient(45deg, #3498DB, #5DADE2)', // Modern Blue 그라데이션
            color: '#FFFFFF',
            '&:hover': {
              background: 'linear-gradient(45deg, #5DADE2, #3498DB)',
            },
          },
          outlined: {
            borderColor: '#3498DB',
            color: '#3498DB',
            '&:hover': {
              borderColor: '#5DADE2',
              backgroundColor: 'rgba(52, 152, 219, 0.1)',
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
                borderColor: 'rgba(52, 152, 219, 0.3)', // Modern Blue 테두리
              },
              '&:hover fieldset': {
                borderColor: '#3498DB',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#3498DB',
              },
            },
            '& .MuiInputLabel-root': {
              '&.Mui-focused': {
                color: '#3498DB',
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
            backgroundColor: mode === 'dark' ? '#1B1B1E' : '#FFFFFF',
          },
        },
      },
      // 칩 컴포넌트 커스터마이징
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
          },
          colorPrimary: {
            backgroundColor: '#3498DB',
            color: '#FFFFFF',
          },
        },
      },
    },
  });
};

export default createAppTheme; 