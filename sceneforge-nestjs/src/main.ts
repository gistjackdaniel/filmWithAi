import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import * as cors from 'cors';
import rateLimit from 'express-rate-limit';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  const server = app.getHttpServer();
  server.setTimeout(10 * 60 * 1000); // 10분으로 증가
  server.keepAliveTimeout = 10 * 60 * 1000; // 10분으로 증가
  server.headersTimeout = 10 * 60 * 1000; // 10분으로 증가

  // 정적 파일 서빙 설정
  app.useStaticAssets(path.join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // /uploads 경로에만 CORS 헤더 추가
  app.use('/uploads', (req, res, next) => {
    const allowedOrigins = [
      configService.get('FRONTEND_URL') || 'http://localhost:3002',
      'https://filmaiforge.com',
      'https://www.filmaiforge.com',
    ];
    
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  });

  // 글로벌 프리픽스 설정
  app.setGlobalPrefix('api');

  // 보안 미들웨어
  app.use(helmet());

  // CORS 설정
  app.use(cors({
    origin: [
      configService.get('FRONTEND_URL') || 'http://localhost:3002',
      'https://filmaiforge.com',
      'https://www.filmaiforge.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));

  // Rate Limiting (인증 엔드포인트는 제외)
  app.use(
    rateLimit({
      windowMs: configService.get('RATE_LIMIT_WINDOW_MS') || 15 * 60 * 1000, // 15분
      max: configService.get('RATE_LIMIT_MAX') || 100, // 최대 100개 요청
      message: {
        error: 'Too Many Requests',
        message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
      },
      skip: (req) => {
        const path = req.path || '';
        // 전역 프리픽스가 포함된 실제 경로 기준으로 체크
        return path.startsWith('/api/auth');
      },
    }),
  );

  // 글로벌 파이프 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );


  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('SceneForge API')
    .setDescription('SceneForge 영화 제작 관리 시스템 API 문서')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = configService.get('PORT') || 5001;
  await app.listen(port);
  
  console.log(`🚀 SceneForge NestJS 서버가 포트 ${port}에서 실행 중입니다.`);
  console.log(`📋 OpenAPI JSON: http://localhost:${port}/docs`);
}
bootstrap();
