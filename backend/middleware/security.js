const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const { corsConfig, rateLimitConfig, helmetConfig } = require('../config/security');

/**
 * 보안 미들웨어 설정
 * API 보안 강화를 위한 미들웨어들
 */

/**
 * Rate Limiting 미들웨어
 * API 요청 제한을 통한 DDoS 방지
 */
const rateLimiter = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.max,
  message: rateLimitConfig.message,
  standardHeaders: rateLimitConfig.standardHeaders,
  legacyHeaders: rateLimitConfig.legacyHeaders,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: rateLimitConfig.message,
      retryAfter: Math.ceil(rateLimitConfig.windowMs / 1000)
    });
  }
});

/**
 * CORS 미들웨어
 * Cross-Origin Resource Sharing 설정
 */
const corsMiddleware = cors({
  origin: corsConfig.origin,
  credentials: corsConfig.credentials,
  methods: corsConfig.methods,
  allowedHeaders: corsConfig.allowedHeaders
});

/**
 * Helmet 미들웨어
 * 보안 헤더 설정
 */
const helmetMiddleware = helmet({
  contentSecurityPolicy: helmetConfig.contentSecurityPolicy,
  hsts: helmetConfig.hsts
});

/**
 * SQL Injection 방지 미들웨어
 * 요청 데이터 검증 및 정제
 */
const sqlInjectionProtection = (req, res, next) => {
  try {
    // 요청 본문 검증
    if (req.body) {
      const sanitizedBody = sanitizeData(req.body);
      req.body = sanitizedBody;
    }
    
    // 쿼리 파라미터 검증
    if (req.query) {
      const sanitizedQuery = sanitizeData(req.query);
      req.query = sanitizedQuery;
    }
    
    // URL 파라미터 검증
    if (req.params) {
      const sanitizedParams = sanitizeData(req.params);
      req.params = sanitizedParams;
    }
    
    next();
  } catch (error) {
    console.error('❌ SQL Injection 방지 미들웨어 오류:', error.message);
    res.status(400).json({
      error: 'Invalid Request',
      message: '잘못된 요청 데이터입니다.'
    });
  }
};

/**
 * 데이터 정제 함수
 * @param {any} data - 정제할 데이터
 * @returns {any} 정제된 데이터
 */
const sanitizeData = (data) => {
  if (typeof data === 'string') {
    return sanitizeString(data);
  } else if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  } else if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeData(value);
    }
    return sanitized;
  }
  return data;
};

/**
 * 문자열 정제 함수
 * @param {string} str - 정제할 문자열
 * @returns {string} 정제된 문자열
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  // SQL Injection 패턴 제거
  const sqlPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter)\b)/gi,
    /(\b(or|and)\b\s+\d+\s*=\s*\d+)/gi,
    /(\b(union|select|insert|update|delete|drop|create|alter)\b.*\b(union|select|insert|update|delete|drop|create|alter)\b)/gi
  ];
  
  let sanitized = str;
  sqlPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // 특수 문자 이스케이프
  sanitized = sanitized
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  
  return sanitized.trim();
};

/**
 * 사용자별 데이터 격리 검증 미들웨어
 * 사용자가 자신의 데이터만 접근할 수 있도록 검증
 */
const userDataIsolation = (req, res, next) => {
  try {
    const userId = req.user?.id;
    const requestedUserId = req.params.userId || req.body.userId || req.query.userId;
    
    // 관리자 권한 확인 (필요시)
    if (req.user?.role === 'admin') {
      return next();
    }
    
    // 사용자 ID 검증
    if (requestedUserId && requestedUserId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: '다른 사용자의 데이터에 접근할 수 없습니다.'
      });
    }
    
    // 프로젝트 소유권 검증
    if (req.params.projectId) {
      const projectId = req.params.projectId;
      // 실제로는 데이터베이스에서 프로젝트 소유권을 확인해야 함
      // 여기서는 기본적인 검증만 수행
      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: '인증이 필요합니다.'
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('❌ 사용자 데이터 격리 검증 오류:', error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '서버 오류가 발생했습니다.'
    });
  }
};

/**
 * API 권한 검증 미들웨어 강화
 * 세부적인 권한 검증
 */
const enhancedAuthMiddleware = (req, res, next) => {
  try {
    // JWT 토큰 검증 (기존 auth 미들웨어에서 처리)
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '유효한 인증 토큰이 필요합니다.'
      });
    }
    
    // 사용자 활성 상태 확인
    if (!req.user.isActive) {
      return res.status(403).json({
        error: 'Forbidden',
        message: '비활성화된 계정입니다.'
      });
    }
    
    // 요청 메서드별 권한 검증
    const method = req.method;
    const path = req.path;
    
    // 읽기 권한 (GET)
    if (method === 'GET') {
      // 기본적으로 읽기 권한 허용
      return next();
    }
    
    // 쓰기 권한 (POST, PUT, DELETE)
    if (['POST', 'PUT', 'DELETE'].includes(method)) {
      // 프로젝트 생성/수정 권한 확인
      if (path.includes('/projects') || path.includes('/contes')) {
        // 사용자가 로그인되어 있고 활성 상태인지 확인
        if (req.user && req.user.isActive) {
          return next();
        }
      }
    }
    
    // 기본적으로 권한 거부
    return res.status(403).json({
      error: 'Forbidden',
      message: '해당 작업에 대한 권한이 없습니다.'
    });
    
  } catch (error) {
    console.error('❌ 권한 검증 미들웨어 오류:', error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '서버 오류가 발생했습니다.'
    });
  }
};

/**
 * 요청 로깅 미들웨어
 * 보안 감사를 위한 요청 로깅
 */
const requestLogging = (req, res, next) => {
  const startTime = Date.now();
  
  // 요청 정보 로깅
  console.log(`🔍 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log(`   User: ${req.user?.email || 'Anonymous'}`);
  console.log(`   IP: ${req.ip}`);
  console.log(`   User-Agent: ${req.get('User-Agent')}`);
  
  // 응답 완료 후 로깅
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`✅ ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
};

/**
 * 에러 핸들링 미들웨어
 * 보안 관련 에러 처리
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ 에러 발생:', err);
  
  // 보안 관련 에러 처리
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: '입력 데이터가 올바르지 않습니다.',
      details: err.message
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: '인증이 필요합니다.'
    });
  }
  
  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      error: 'Forbidden',
      message: '해당 작업에 대한 권한이 없습니다.'
    });
  }
  
  // 기본 에러 응답
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? '서버 오류가 발생했습니다.' 
      : err.message
  });
};

module.exports = {
  rateLimiter,
  corsMiddleware,
  helmetMiddleware,
  sqlInjectionProtection,
  userDataIsolation,
  enhancedAuthMiddleware,
  requestLogging,
  errorHandler
}; 