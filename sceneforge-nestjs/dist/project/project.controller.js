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
exports.ProjectsController = void 0;
const common_1 = require("@nestjs/common");
const project_service_1 = require("./project.service");
const jwt_auth_guard_1 = require("../common/guard/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const request_dto_1 = require("./dto/request.dto");
const response_dto_1 = require("./dto/response.dto");
let ProjectsController = class ProjectsController {
    projectsService;
    constructor(projectsService) {
        this.projectsService = projectsService;
    }
    async create(user, createProjectDto) {
        const project = await this.projectsService.create(user.profileId, createProjectDto);
        return project;
    }
    async searchParticipatingProjects(user) {
        const projects = await this.projectsService.searchParticipatingProjects({
            profileId: user.profileId,
        });
        return projects;
    }
    async searchFavorites(user) {
        const result = await this.projectsService.searchFavorites({
            profileId: user.profileId,
        });
        return result;
    }
    async findOne(user, id) {
        const project = await this.projectsService.findParticipatingOne({ profileId: user.profileId, _id: id });
        return project;
    }
    async update(user, id, updateProjectDto) {
        const result = await this.projectsService.update(user.profileId, id, updateProjectDto);
        return result;
    }
    async delete(user, id) {
        const result = await this.projectsService.delete({
            profileId: user.profileId,
            _id: id,
        });
        return result;
    }
    async restoreProject(user, id) {
        const result = await this.projectsService.restoreProject({
            profileId: user.profileId,
            projectId: id,
        });
        return result;
    }
};
exports.ProjectsController = ProjectsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '프로젝트 생성' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '프로젝트 생성 성공', type: response_dto_1.ProjectResponseDto }),
    (0, swagger_1.ApiBody)({ type: request_dto_1.CreateProjectRequestDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, request_dto_1.CreateProjectRequestDto]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '사용자 프로젝트 목록 조회' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '프로젝트 목록 조회 성공', type: [response_dto_1.ProjectResponseDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "searchParticipatingProjects", null);
__decorate([
    (0, common_1.Get)('favorite'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '즐겨찾기 프로젝트 목록 조회' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '즐겨찾기 프로젝트 목록 조회 성공', type: [response_dto_1.ProjectResponseDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "searchFavorites", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '프로젝트 상세 조회' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '프로젝트 조회 성공', type: response_dto_1.ProjectResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '프로젝트 수정' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '프로젝트 수정 성공', type: response_dto_1.ProjectResponseDto }),
    (0, swagger_1.ApiBody)({ type: request_dto_1.UpdateProjectRequestDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, request_dto_1.UpdateProjectRequestDto]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '프로젝트 삭제' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '프로젝트 삭제 성공', type: response_dto_1.ProjectResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/restore'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '프로젝트 복원' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '프로젝트 복원 성공', type: response_dto_1.ProjectResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "restoreProject", null);
exports.ProjectsController = ProjectsController = __decorate([
    (0, swagger_1.ApiTags)('Project'),
    (0, common_1.Controller)('project'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [project_service_1.ProjectService])
], ProjectsController);
//# sourceMappingURL=project.controller.js.map