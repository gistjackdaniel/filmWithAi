/**
 * 보안 설정 관리
 * 환경 변수 검증 및 보안 설정
 */

/**
 * 필수 환경 변수 검증
 * @returns {Object} 검증된 환경 변수 객체
 */
const validateEnvironmentVariables = () => {
  const requiredVars = [
    'OPENAI_API_KEY',
    'MONGODB_URI',
    'JWT_SECRET'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`필수 환경 변수가 누락되었습니다: ${missingVars.join(', ')}`);
  }
  
  return {
    openaiApiKey: process.env.OPENAI_API_KEY,
    mongodbUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    port: process.env.PORT || 5001,
    nodeEnv: process.env.NODE_ENV || 'development'
  };
};

/**
 * JWT 설정
 */
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: '7d', // 7일
  refreshExpiresIn: '30d', // 30일
  algorithm: 'HS256'
};

/**
 * CORS 설정
 */
const corsConfig = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // 프로덕션 도메인
    : ['http://localhost:3002', 'http://localhost:3000'], // 개발 환경
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

/**
 * Rate Limiting 설정
 */
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // IP당 최대 요청 수
  message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false
};

/**
 * Helmet 보안 헤더 설정
 */
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
};

/**
 * MongoDB 연결 보안 설정
 */
const mongoConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,
  bufferCommands: false
};

/**
 * 로깅 설정
 */
const loggingConfig = {
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: process.env.NODE_ENV === 'production' ? 'json' : 'dev',
  transports: ['console', 'file']
};

/**
 * 보안 미들웨어 설정
 */
const securityMiddleware = {
  // XSS 방지
  xssProtection: true,
  
  // 클릭재킹 방지
  frameguard: {
    action: 'deny'
  },
  
  // MIME 타입 스니핑 방지
  noSniff: true,
  
  // IE XSS 필터 비활성화
  ieNoOpen: true
};

module.exports = {
  validateEnvironmentVariables,
  jwtConfig,
  corsConfig,
  rateLimitConfig,
  helmetConfig,
  mongoConfig,
  loggingConfig,
  securityMiddleware
}; 