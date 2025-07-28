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
exports.ProfileController = void 0;
const common_1 = require("@nestjs/common");
const profile_service_1 = require("./profile.service");
const jwt_auth_guard_1 = require("../common/guard/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const request_dto_1 = require("./dto/request.dto");
const response_dto_1 = require("./dto/response.dto");
let ProfileController = class ProfileController {
    profileService;
    constructor(profileService) {
        this.profileService = profileService;
    }
    async create(user, createProfileDto) {
        const profile = await this.profileService.createProfile(createProfileDto);
        return profile;
    }
    async findOne(user) {
        const profile = await this.profileService.findProfileById(user.profileId);
        return profile;
    }
    async update(user, updateProfileDto) {
        const profile = await this.profileService.findProfileById(user.profileId);
        return profile;
    }
    async delete(user) {
        const profile = await this.profileService.deleteProfile({ profileId: user.profileId });
        return profile;
    }
    async pushFavorite(user, projectId) {
        const profile = await this.profileService.pushFavorite(user.profileId, projectId);
        return profile;
    }
    async pullFavorite(user, projectId) {
        const profile = await this.profileService.pullFavorite(user.profileId, projectId);
        return profile;
    }
};
exports.ProfileController = ProfileController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '프로필 생성' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '프로필 생성 성공', type: response_dto_1.ProfileResponseDto }),
    (0, swagger_1.ApiBody)({ type: request_dto_1.CreateProfileRequestDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, request_dto_1.CreateProfileRequestDto]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '프로필 조회' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '프로필 조회 성공', type: response_dto_1.ProfileResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '프로필 수정' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '프로필 수정 성공', type: response_dto_1.ProfileResponseDto }),
    (0, swagger_1.ApiBody)({ type: request_dto_1.UpdateProfileRequestDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, request_dto_1.UpdateProfileRequestDto]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '프로필 삭제' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '프로필 삭제 성공', type: response_dto_1.ProfileResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)('project/:projectId/favorite'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '즐겨찾기 추가' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '즐겨찾기 추가 성공', type: response_dto_1.ProfileResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "pushFavorite", null);
__decorate([
    (0, common_1.Delete)('project/:projectId/favorite'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '즐겨찾기 삭제' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '즐겨찾기 삭제 성공', type: response_dto_1.ProfileResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "pullFavorite", null);
exports.ProfileController = ProfileController = __decorate([
    (0, swagger_1.ApiTags)('Profile'),
    (0, common_1.Controller)('profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [profile_service_1.ProfileService])
], ProfileController);
//# sourceMappingURL=profile.controller.js.map