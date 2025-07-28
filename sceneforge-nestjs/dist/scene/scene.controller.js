"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const request_dto_1 = require("./dto/request.dto");
const response_dto_1 = require("./dto/response.dto");
const jwt_auth_guard_1 = require("../common/guard/jwt-auth.guard");
const scene_service_1 = require("./scene.service");
let SceneController = class SceneController {
    sceneService;
    constructor(sceneService) {
        this.sceneService = sceneService;
    }
    async create(projectId, createSceneDto) {
        return this.sceneService.create(projectId, createSceneDto);
    }
    async findByProjectId(projectId) {
        return this.sceneService.findByProjectId(projectId);
    }
    async findOne(projectId, sceneId) {
        return this.sceneService.findById(projectId, sceneId);
    }
    async update(projectId, sceneId, updateSceneDto) {
        return this.sceneService.update(projectId, sceneId, updateSceneDto);
    }
    async delete(projectId, sceneId) {
        return this.sceneService.delete(projectId, sceneId);
    }
    async restore(projectId, sceneId) {
        return this.sceneService.restore(projectId, sceneId);
    }
    async createDraft(projectId, createSceneDraftRequestDto) {
        return this.sceneService.createDraft(projectId, createSceneDraftRequestDto);
    }
};
exports.SceneController = SceneController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '씬 생성', description: '새로운 씬을 생성합니다.' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: '씬이 성공적으로 생성되었습니다.',
        type: response_dto_1.SceneResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.'
    }),
    (0, swagger_1.ApiParam)({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' }),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, request_dto_1.CreateSceneRequestDto]),
    __metadata("design:returntype", Promise)
], SceneController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '프로젝트 씬 목록 조회', description: '특정 프로젝트의 모든 씬을 조회합니다.' }),
    (0, swagger_1.ApiParam)({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '프로젝트 씬 목록을 성공적으로 조회했습니다.',
        type: [response_dto_1.SceneResponseDto]
    }),
    __param(0, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SceneController.prototype, "findByProjectId", null);
__decorate([
    (0, common_1.Get)(':sceneId'),
    (0, swagger_1.ApiOperation)({ summary: '씬 상세 조회', description: '특정 씬의 상세 정보를 조회합니다.' }),
    (0, swagger_1.ApiParam)({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiParam)({ name: 'sceneId', description: '씬 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '씬을 성공적으로 조회했습니다.',
        type: response_dto_1.SceneResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '씬을 찾을 수 없습니다.'
    }),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('sceneId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SceneController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':sceneId'),
    (0, swagger_1.ApiOperation)({ summary: '씬 수정', description: '기존 씬을 수정합니다.' }),
    (0, swagger_1.ApiParam)({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiParam)({ name: 'sceneId', description: '씬 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '씬이 성공적으로 수정되었습니다.',
        type: response_dto_1.SceneResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '씬을 찾을 수 없습니다.'
    }),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('sceneId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, request_dto_1.UpdateSceneRequestDto]),
    __metadata("design:returntype", Promise)
], SceneController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':sceneId'),
    (0, swagger_1.ApiOperation)({ summary: '씬 삭제 (Soft Delete)', description: '특정 씬을 소프트 삭제합니다.' }),
    (0, swagger_1.ApiParam)({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiParam)({ name: 'sceneId', description: '씬 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '씬이 성공적으로 삭제되었습니다.',
        type: response_dto_1.SceneResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '씬을 찾을 수 없습니다.'
    }),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('sceneId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SceneController.prototype, "delete", null);
__decorate([
    (0, common_1.Put)(':sceneId/restore'),
    (0, swagger_1.ApiOperation)({ summary: '삭제된 씬 복구', description: '삭제된 씬을 복구합니다.' }),
    (0, swagger_1.ApiParam)({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiParam)({ name: 'sceneId', description: '씬 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '씬이 성공적으로 복구되었습니다.',
        type: response_dto_1.SceneResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '삭제된 씬을 찾을 수 없습니다.'
    }),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('sceneId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SceneController.prototype, "restore", null);
__decorate([
    (0, common_1.Post)('draft'),
    (0, swagger_1.ApiOperation)({ summary: '씬 초안 생성', description: '새로운 씬 초안을 생성합니다.' }),
    (0, swagger_1.ApiParam)({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: '씬 초안이 성공적으로 생성되었습니다.',
        type: [response_dto_1.SceneResponseDto]
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.'
    }),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, request_dto_1.CreateSceneDraftRequestDto]),
    __metadata("design:returntype", Promise)
], SceneController.prototype, "createDraft", null);
exports.SceneController = SceneController = __decorate([
    (0, swagger_1.ApiTags)('Scene'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('project/:projectId/scene'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [scene_service_1.SceneService])
], SceneController);
//# sourceMappingURL=scene.controller.js.map