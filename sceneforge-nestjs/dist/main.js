"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = require("helmet");
const cors = require("cors");
const express_rate_limit_1 = require("express-rate-limit");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const server = app.getHttpServer();
    server.setTimeout(2 * 60 * 1000);
    server.keepAliveTimeout = 2 * 60 * 1000;
    server.headersTimeout = 2 * 60 * 1000;
    app.use('/uploads', (req, res, next) => {
        res.header('Access-Control-Allow-Origin', configService.get('FRONTEND_URL') || 'http://localhost:3002');
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
    app.setGlobalPrefix('api');
    app.use((0, helmet_1.default)());
    app.use(cors({
        origin: configService.get('FRONTEND_URL') || 'http://localhost:3002',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));
    app.use((0, express_rate_limit_1.default)({
        windowMs: configService.get('RATE_LIMIT_WINDOW_MS') || 15 * 60 * 1000,
        max: configService.get('RATE_LIMIT_MAX') || 100,
        message: {
            error: 'Too Many Requests',
            message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        },
    }));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('SceneForge API')
        .setDescription('SceneForge 영화 제작 관리 시스템 API 문서')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const port = configService.get('PORT') || 5001;
    await app.listen(port);
    console.log(`🚀 SceneForge NestJS 서버가 포트 ${port}에서 실행 중입니다.`);
    console.log(`📋 OpenAPI JSON: http://localhost:${port}/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map