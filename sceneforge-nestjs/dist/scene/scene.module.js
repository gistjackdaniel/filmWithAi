"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const scene_schema_1 = require("./schema/scene.schema");
const jwt_1 = require("@nestjs/jwt");
const scene_controller_1 = require("./scene.controller");
const scene_service_1 = require("./scene.service");
const ai_module_1 = require("../ai/ai.module");
const config_1 = require("@nestjs/config");
const project_module_1 = require("../project/project.module");
let SceneModule = class SceneModule {
};
exports.SceneModule = SceneModule;
exports.SceneModule = SceneModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: scene_schema_1.Scene.name, schema: scene_schema_1.SceneSchema }]),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    secret: configService.get('JWT_SECRET'),
                    signOptions: {
                        expiresIn: configService.get('JWT_EXPIRES_IN') || '24h',
                    },
                }),
                inject: [config_1.ConfigService],
            }),
            ai_module_1.AiModule,
            project_module_1.ProjectModule,
        ],
        controllers: [scene_controller_1.SceneController],
        providers: [scene_service_1.SceneService],
        exports: [scene_service_1.SceneService],
    })
], SceneModule);
//# sourceMappingURL=scene.module.js.map