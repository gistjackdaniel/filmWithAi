const express = require('express'); // 웹 서버 프레임워크
const cors = require('cors'); // Cross-Origin 요청 허용
const dotenv = require('dotenv'); // 환경변수 관리
const authRoutes = require('./routes/auth'); // 인증 라우트
const projectRoutes = require('./routes/projects'); // 프로젝트 라우트

// 환경변수 로드
dotenv.config();

const app = express(); // 익스프레스 애플리케이션 인스턴스 생성
const PORT = process.env.PORT || 5000; // 포트 번호 설정

// 미들웨어 설정
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'], // 허용된 출처
  credentials: true // 크로스 도메인 요청 허용
}));
app.use(express.json()); // JSON 요청 파싱

// 라우트 설정
app.use('/api/auth', authRoutes); // /api/auth/* 경로를 auth 라우터로 연결
app.use('/api/projects', projectRoutes); // /api/projects/* 경로를 project 라우터로 연결

// 헬스 체크 엔드포인트
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SceneForge Backend Server is running' }); // 상태 확인 엔드포인트
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' }); // 404 에러 핸들러
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error('Server error:', err); // 서버 에러 로깅
  res.status(500).json({ error: 'Internal server error' }); // 500 에러 핸들러
});

app.listen(PORT, () => {
  console.log(`🚀 SceneForge Backend Server running on port ${PORT}`); // 서버 실행 메시지
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`); // 상태 확인 엔드포인트
}); 