import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { validationSchema } from '@/config/validation.schema';
import { RequestLoggingMiddleware } from '@/common/middleware/request-logging.middleware';
import { ResponseLoggingMiddleware } from '@/common/middleware/response-logging.middleware';

// 모듈들
import { AuthModule } from '@/auth/auth.module';
import { ProfileModule } from '@/profile/profile.module';
import { ProjectModule } from '@/project/project.module';
import { SceneModule } from '@/scene/scene.module';
import { CutModule } from '@/cut/cut.module';
import { SchedulerModule } from '@/scheduler/scheduler.module';

@Module({
  imports: [
    // 환경 설정
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema,
    }),
    
    // MongoDB 연결
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sceneforge_db',
        dbName: process.env.MONGODB_DB_NAME || 'sceneforge',
      }),
    }),
    
    // 캐시 모듈
    CacheModule.registerAsync({
      useFactory: () => ({
        store: 'memory',
        ttl: 300, // 5분
        max: 1000,
      }),
    }),
    
    // 스케줄러 모듈
    ScheduleModule.forRoot(),
    
    // 정적 파일 서빙
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    
    // 기능 모듈들
    AuthModule,
    ProfileModule,
    ProjectModule,
    SceneModule,
    CutModule,
    SchedulerModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggingMiddleware, ResponseLoggingMiddleware)
      .forRoutes('*'); // 모든 라우트에 적용
  }
}
