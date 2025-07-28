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
exports.SchedulerController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const request_dto_1 = require("./dto/request.dto");
const response_dto_1 = require("./dto/response.dto");
const jwt_auth_guard_1 = require("../common/guard/jwt-auth.guard");
const scheduler_service_1 = require("./scheduler.service");
let SchedulerController = class SchedulerController {
    schedulerService;
    constructor(schedulerService) {
        this.schedulerService = schedulerService;
    }
    async create(projectId, createSchedulerDto) {
        return this.schedulerService.create(projectId, createSchedulerDto);
    }
    async findByProjectId(projectId) {
        return this.schedulerService.findByProjectId(projectId);
    }
    async findOne(projectId, schedulerId) {
        return this.schedulerService.findById(projectId, schedulerId);
    }
    async update(projectId, schedulerId, updateSchedulerDto) {
        return this.schedulerService.update(projectId, schedulerId, updateSchedulerDto);
    }
    async delete(projectId, schedulerId) {
        return this.schedulerService.delete(projectId, schedulerId);
    }
};
exports.SchedulerController = SchedulerController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '스케줄러 생성', description: '새로운 스케줄러를 생성합니다.' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: '스케줄러가 성공적으로 생성되었습니다.',
        type: response_dto_1.SchedulerResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.'
    }),
    (0, swagger_1.ApiParam)({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' }),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, request_dto_1.CreateSchedulerRequestDto]),
    __metadata("design:returntype", Promise)
], SchedulerController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '프로젝트 스케줄러 목록 조회', description: '특정 프로젝트의 모든 스케줄러를 조회합니다.' }),
    (0, swagger_1.ApiParam)({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '프로젝트 스케줄러 목록을 성공적으로 조회했습니다.',
        type: [response_dto_1.SchedulerResponseDto]
    }),
    __param(0, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SchedulerController.prototype, "findByProjectId", null);
__decorate([
    (0, common_1.Get)(':schedulerId'),
    (0, swagger_1.ApiOperation)({ summary: '스케줄러 상세 조회', description: '특정 스케줄러의 상세 정보를 조회합니다.' }),
    (0, swagger_1.ApiParam)({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiParam)({ name: 'schedulerId', description: '스케줄러 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '스케줄러를 성공적으로 조회했습니다.',
        type: response_dto_1.SchedulerResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '스케줄러를 찾을 수 없습니다.'
    }),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('schedulerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SchedulerController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':schedulerId'),
    (0, swagger_1.ApiOperation)({ summary: '스케줄러 수정', description: '스케줄러를 수정합니다.' }),
    (0, swagger_1.ApiParam)({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiParam)({ name: 'schedulerId', description: '스케줄러 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '스케줄러가 성공적으로 수정되었습니다.',
        type: response_dto_1.SchedulerResponseDto
    }),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('schedulerId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, request_dto_1.UpdateSchedulerRequestDto]),
    __metadata("design:returntype", Promise)
], SchedulerController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':schedulerId'),
    (0, swagger_1.ApiOperation)({ summary: '스케줄러 삭제', description: '스케줄러를 삭제합니다. (소프트 삭제)' }),
    (0, swagger_1.ApiParam)({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiParam)({ name: 'schedulerId', description: '스케줄러 ID', example: '507f1f77bcf86cd799439011' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '스케줄러가 성공적으로 삭제되었습니다.',
        type: response_dto_1.SchedulerResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '스케줄러를 찾을 수 없습니다.'
    }),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('schedulerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SchedulerController.prototype, "delete", null);
exports.SchedulerController = SchedulerController = __decorate([
    (0, swagger_1.ApiTags)('Scheduler'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('project/:projectId/scheduler'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [scheduler_service_1.SchedulerService])
], SchedulerController);
//# sourceMappingURL=scheduler.controller.js.map