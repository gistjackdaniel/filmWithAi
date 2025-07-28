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
exports.CutController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const request_dto_1 = require("./dto/request.dto");
const response_dto_1 = require("./dto/response.dto");
const jwt_auth_guard_1 = require("../common/guard/jwt-auth.guard");
const cut_service_1 = require("./cut.service");
let CutController = class CutController {
    cutService;
    constructor(cutService) {
        this.cutService = cutService;
    }
    async create(projectId, sceneId, createCutDto) {
        return this.cutService.create(projectId, sceneId, createCutDto);
    }
    async createDraft(projectId, sceneId, createCutDraftRequestDto) {
        return this.cutService.createDraft(projectId, sceneId, createCutDraftRequestDto);
    }
    async findBySceneId(projectId, sceneId) {
        return this.cutService.findBySceneId(projectId, sceneId);
    }
    async findOne(projectId, sceneId, cutId) {
        return this.cutService.findById(projectId, sceneId, cutId);
    }
    async update(projectId, sceneId, cutId, updateCutDto) {
        return this.cutService.update(projectId, sceneId, cutId, updateCutDto);
    }
    async delete(projectId, sceneId, cutId) {
        return this.cutService.delete(projectId, sceneId, cutId);
    }
    async restore(projectId, sceneId, cutId) {
        return this.cutService.restore(projectId, sceneId, cutId);
    }
    async updateOrder(projectId, sceneId, cutId, newOrder) {
        return this.cutService.updateOrder(projectId, sceneId, cutId, newOrder);
    }
};
exports.CutController = CutController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '컷 생성', description: '새로운 컷을 생성합니다.' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: '컷이 성공적으로 생성되었습니다.',
        type: response_dto_1.CutResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.'
    }),
    (0, swagger_1.ApiParam)({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiParam)({ name: 'sceneId', description: '씬 ID', example: '507f1f77bcf86cd799439011' }),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('sceneId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, request_dto_1.CreateCutRequestDto]),
    __metadata("design:returntype", Promise)
], CutController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('draft'),
    (0, swagger_1.ApiOperation)({ summary: '컷 초안 생성', description: 'AI를 통해 컷 초안을 생성합니다. 사용자가 편집 후 createCut을 통해 저장할 수 있습니다.' }),
    (0, swagger_1.ApiParam)({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiParam)({ name: 'sceneId', description: '씬 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: '컷 초안이 성공적으로 생성되었습니다. 사용자가 편집 후 createCut을 통해 저장할 수 있습니다.',
        type: [response_dto_1.CutResponseDto]
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.'
    }),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('sceneId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, request_dto_1.CreateCutDraftRequestDto]),
    __metadata("design:returntype", Promise)
], CutController.prototype, "createDraft", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '씬 컷 목록 조회', description: '특정 씬의 모든 컷을 조회합니다.' }),
    (0, swagger_1.ApiParam)({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiParam)({ name: 'sceneId', description: '씬 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '씬 컷 목록을 성공적으로 조회했습니다.',
        type: [response_dto_1.CutResponseDto]
    }),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('sceneId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CutController.prototype, "findBySceneId", null);
__decorate([
    (0, common_1.Get)(':cutId'),
    (0, swagger_1.ApiOperation)({ summary: '컷 상세 조회', description: '특정 컷의 상세 정보를 조회합니다.' }),
    (0, swagger_1.ApiParam)({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiParam)({ name: 'sceneId', description: '씬 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiParam)({ name: 'cutId', description: '컷 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '컷을 성공적으로 조회했습니다.',
        type: response_dto_1.CutResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '컷을 찾을 수 없습니다.'
    }),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('sceneId')),
    __param(2, (0, common_1.Param)('cutId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CutController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':cutId'),
    (0, swagger_1.ApiOperation)({ summary: '컷 수정', description: '기존 컷을 수정합니다.' }),
    (0, swagger_1.ApiParam)({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiParam)({ name: 'sceneId', description: '씬 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiParam)({ name: 'cutId', description: '컷 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '컷이 성공적으로 수정되었습니다.',
        type: response_dto_1.CutResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '컷을 찾을 수 없습니다.'
    }),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('sceneId')),
    __param(2, (0, common_1.Param)('cutId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, request_dto_1.UpdateCutRequestDto]),
    __metadata("design:returntype", Promise)
], CutController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':cutId'),
    (0, swagger_1.ApiOperation)({ summary: '컷 삭제 (Soft Delete)', description: '특정 컷을 소프트 삭제합니다.' }),
    (0, swagger_1.ApiParam)({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiParam)({ name: 'sceneId', description: '씬 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiParam)({ name: 'cutId', description: '컷 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '컷이 성공적으로 삭제되었습니다.',
        type: response_dto_1.CutResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '컷을 찾을 수 없습니다.'
    }),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('sceneId')),
    __param(2, (0, common_1.Param)('cutId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CutController.prototype, "delete", null);
__decorate([
    (0, common_1.Put)(':cutId/restore'),
    (0, swagger_1.ApiOperation)({ summary: '삭제된 컷 복구', description: '삭제된 컷을 복구합니다.' }),
    (0, swagger_1.ApiParam)({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiParam)({ name: 'sceneId', description: '씬 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiParam)({ name: 'cutId', description: '컷 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '컷이 성공적으로 복구되었습니다.',
        type: response_dto_1.CutResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '삭제된 컷을 찾을 수 없습니다.'
    }),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('sceneId')),
    __param(2, (0, common_1.Param)('cutId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CutController.prototype, "restore", null);
__decorate([
    (0, common_1.Put)(':cutId/order'),
    (0, swagger_1.ApiOperation)({ summary: '컷 순서 변경', description: '컷의 순서를 변경합니다.' }),
    (0, swagger_1.ApiParam)({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiParam)({ name: 'sceneId', description: '씬 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiParam)({ name: 'cutId', description: '컷 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '컷 순서가 성공적으로 변경되었습니다.',
        type: response_dto_1.CutResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '컷을 찾을 수 없습니다.'
    }),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('sceneId')),
    __param(2, (0, common_1.Param)('cutId')),
    __param(3, (0, common_1.Body)('order')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number]),
    __metadata("design:returntype", Promise)
], CutController.prototype, "updateOrder", null);
exports.CutController = CutController = __decorate([
    (0, swagger_1.ApiTags)('Cut'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('project/:projectId/scene/:sceneId/cut'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [cut_service_1.CutService])
], CutController);
//# sourceMappingURL=cut.controller.js.map