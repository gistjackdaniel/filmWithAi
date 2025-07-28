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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestoreProjectRequestDto = exports.DeleteProjectRequestDto = exports.UpdateProjectRequestDto = exports.SearchProjectRequestDto = exports.PushFavoriteRequestDto = exports.PullFavoriteRequestDto = exports.FindProjectDetailRequestDto = exports.CreateProjectRequestDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateProjectRequestDto {
    title;
    synopsis;
    story;
    tags;
    isPublic;
    genre;
    estimatedDuration;
}
exports.CreateProjectRequestDto = CreateProjectRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 제목',
        example: '마법의 모험',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateProjectRequestDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 시놉시스',
        example: '한 소년이 마법의 세계로 모험을 떠나는 이야기',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProjectRequestDto.prototype, "synopsis", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '스토리 내용',
        example: '상세한 스토리 내용...',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProjectRequestDto.prototype, "story", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 태그',
        example: ['판타지', '모험', '가족'],
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateProjectRequestDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '공개 여부',
        example: false,
        required: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateProjectRequestDto.prototype, "isPublic", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '장르',
        example: ['드라마', '모험', '가족'],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateProjectRequestDto.prototype, "genre", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '예상 지속 시간',
        example: '90분',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProjectRequestDto.prototype, "estimatedDuration", void 0);
class FindProjectDetailRequestDto {
    profileId;
    _id;
}
exports.FindProjectDetailRequestDto = FindProjectDetailRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, swagger_1.ApiProperty)({
        description: '프로필 ID',
        example: '60a75b1b5b1b1b1b1b1b1b1b',
    }),
    __metadata("design:type", String)
], FindProjectDetailRequestDto.prototype, "profileId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 ID',
        example: '60a75b1b5b1b1b1b1b1b1b1b',
    }),
    __metadata("design:type", String)
], FindProjectDetailRequestDto.prototype, "_id", void 0);
class PullFavoriteRequestDto {
    profileId;
    projectId;
}
exports.PullFavoriteRequestDto = PullFavoriteRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, swagger_1.ApiProperty)({
        description: '프로필 ID',
        example: '60a75b1b5b1b1b1b1b1b1b1b',
    }),
    __metadata("design:type", String)
], PullFavoriteRequestDto.prototype, "profileId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 ID',
        example: '60a75b1b5b1b1b1b1b1b1b1b',
    }),
    __metadata("design:type", String)
], PullFavoriteRequestDto.prototype, "projectId", void 0);
class PushFavoriteRequestDto {
    profileId;
    projectId;
}
exports.PushFavoriteRequestDto = PushFavoriteRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, swagger_1.ApiProperty)({
        description: '프로필 ID',
        example: '60a75b1b5b1b1b1b1b1b1b1b',
    }),
    __metadata("design:type", String)
], PushFavoriteRequestDto.prototype, "profileId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 ID',
        example: '60a75b1b5b1b1b1b1b1b1b1b',
    }),
    __metadata("design:type", String)
], PushFavoriteRequestDto.prototype, "projectId", void 0);
class SearchProjectRequestDto {
    profileId;
}
exports.SearchProjectRequestDto = SearchProjectRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, swagger_1.ApiProperty)({
        description: '프로필 ID',
        example: '60a75b1b5b1b1b1b1b1b1b1b',
    }),
    __metadata("design:type", String)
], SearchProjectRequestDto.prototype, "profileId", void 0);
class UpdateProjectRequestDto extends (0, swagger_1.PartialType)(CreateProjectRequestDto) {
}
exports.UpdateProjectRequestDto = UpdateProjectRequestDto;
class DeleteProjectRequestDto {
    profileId;
    _id;
}
exports.DeleteProjectRequestDto = DeleteProjectRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, swagger_1.ApiProperty)({
        description: '프로필 ID',
        example: '60a75b1b5b1b1b1b1b1b1b1b',
    }),
    __metadata("design:type", String)
], DeleteProjectRequestDto.prototype, "profileId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 ID',
        example: '60a75b1b5b1b1b1b1b1b1b1b',
    }),
    __metadata("design:type", String)
], DeleteProjectRequestDto.prototype, "_id", void 0);
class RestoreProjectRequestDto {
    profileId;
    projectId;
}
exports.RestoreProjectRequestDto = RestoreProjectRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, swagger_1.ApiProperty)({
        description: '프로필 ID',
        example: '60a75b1b5b1b1b1b1b1b1b1b',
    }),
    __metadata("design:type", String)
], RestoreProjectRequestDto.prototype, "profileId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 ID',
        example: '60a75b1b5b1b1b1b1b1b1b1b',
    }),
    __metadata("design:type", String)
], RestoreProjectRequestDto.prototype, "projectId", void 0);
//# sourceMappingURL=request.dto.js.map