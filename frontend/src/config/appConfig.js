/**
 * 앱 설정 파일
 * 개발/출시 모드 전환을 위한 설정
 */

// 환경 변수로 모드 제어 (출시 시 쉽게 변경 가능)
const getEnvironmentMode = () => {
  // 1. 환경 변수로 직접 제어 (출시 시 사용)
  if (import.meta.env.VITE_APP_MODE) {
    return import.meta.env.VITE_APP_MODE;
  }
  
  // 2. 개발용 이미지 사용 여부로 제어
  if (import.meta.env.VITE_USE_DEV_IMAGES === 'false') {
    return 'production';
  }
  
  // 3. 기본값: 개발 모드
  return 'development';
};

const appConfig = {
  // 개발 모드 설정
  development: {
    useDevImages: true,           // 개발용 이미지 사용
    apiBaseUrl: 'http://localhost:5001/api',
    appName: 'SceneForge Dev',
    showDevBadge: true,          // 개발용 배지 표시
    enableHotReload: true,       // 핫 리로드 활성화
    logLevel: 'debug',            // 로그 레벨
  },
  
  // 출시 모드 설정
  production: {
    useDevImages: false,          // 실제 OpenAI API 사용
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.sceneforge.com/api',
    appName: 'SceneForge',
    showDevBadge: false,         // 개발용 배지 숨김
    enableHotReload: false,      // 핫 리로드 비활성화
    logLevel: 'error',            // 로그 레벨
  },
};

// 현재 환경에 따른 설정 반환
const getCurrentConfig = () => {
  const env = getEnvironmentMode();
  console.log('🔧 현재 앱 모드:', env);
  return appConfig[env] || appConfig.development;
};

// 개발용 이미지 사용 여부 확인
export const shouldUseDevImages = () => {
  const config = getCurrentConfig();
  return config.useDevImages;
};

// 개발용 배지 표시 여부 확인
export const shouldShowDevBadge = () => {
  const config = getCurrentConfig();
  return config.showDevBadge;
};

// API 기본 URL 반환
export const getApiBaseUrl = () => {
  const config = getCurrentConfig();
  return config.apiBaseUrl;
};

// 앱 이름 반환
export const getAppName = () => {
  const config = getCurrentConfig();
  return config.appName;
};

// 현재 모드 정보 반환
export const getCurrentMode = () => {
  return getEnvironmentMode();
};

export default getCurrentConfig; 