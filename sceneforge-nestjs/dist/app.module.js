"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const cache_manager_1 = require("@nestjs/cache-manager");
const schedule_1 = require("@nestjs/schedule");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const validation_schema_1 = require("./config/validation.schema");
const request_logging_middleware_1 = require("./common/middleware/request-logging.middleware");
const response_logging_middleware_1 = require("./common/middleware/response-logging.middleware");
const auth_module_1 = require("./auth/auth.module");
const profile_module_1 = require("./profile/profile.module");
const project_module_1 = require("./project/project.module");
const scene_module_1 = require("./scene/scene.module");
const cut_module_1 = require("./cut/cut.module");
const scheduler_module_1 = require("./scheduler/scheduler.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(request_logging_middleware_1.RequestLoggingMiddleware, response_logging_middleware_1.ResponseLoggingMiddleware)
            .forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
                validationSchema: validation_schema_1.validationSchema,
            }),
            mongoose_1.MongooseModule.forRootAsync({
                useFactory: () => ({
                    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sceneforge_db',
                    dbName: process.env.MONGODB_DB_NAME || 'sceneforge',
                }),
            }),
            cache_manager_1.CacheModule.registerAsync({
                useFactory: () => ({
                    store: 'memory',
                    ttl: 300,
                    max: 1000,
                }),
            }),
            schedule_1.ScheduleModule.forRoot(),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'uploads'),
                serveRoot: '/uploads',
            }),
            auth_module_1.AuthModule,
            profile_module_1.ProfileModule,
            project_module_1.ProjectModule,
            scene_module_1.SceneModule,
            cut_module_1.CutModule,
            scheduler_module_1.SchedulerModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map