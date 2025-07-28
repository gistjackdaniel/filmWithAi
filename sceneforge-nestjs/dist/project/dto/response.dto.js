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
exports.CreateStoryResponseDto = exports.ProjectResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const mongoose_1 = require("mongoose");
class ProjectResponseDto {
    _id;
    ownerId;
    title;
    synopsis;
    story;
    tags;
    isPublic;
    createdAt;
    updatedAt;
    lastViewedAt;
    isDeleted;
    participants;
    scenes;
    genre;
    estimatedDuration;
}
exports.ProjectResponseDto = ProjectResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 ID',
        example: '507f1f77bcf86cd799439011'
    }),
    __metadata("design:type", mongoose_1.Types.ObjectId)
], ProjectResponseDto.prototype, "_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 소유자 ID',
        example: '507f1f77bcf86cd799439011'
    }),
    __metadata("design:type", mongoose_1.Types.ObjectId)
], ProjectResponseDto.prototype, "ownerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 제목',
        example: '마법의 모험'
    }),
    __metadata("design:type", String)
], ProjectResponseDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 시놉시스',
        example: '한 소년이 마법의 세계로 모험을 떠나는 이야기'
    }),
    __metadata("design:type", String)
], ProjectResponseDto.prototype, "synopsis", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 스토리',
        example: '상세한 스토리 내용...'
    }),
    __metadata("design:type", String)
], ProjectResponseDto.prototype, "story", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 태그',
        example: ['판타지', '모험', '가족']
    }),
    __metadata("design:type", Array)
], ProjectResponseDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 공개 여부',
        example: true
    }),
    __metadata("design:type", Boolean)
], ProjectResponseDto.prototype, "isPublic", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 생성 일시',
        example: '2024-01-15T10:30:00.000Z'
    }),
    __metadata("design:type", Date)
], ProjectResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 수정 일시',
        example: '2024-01-15T10:30:00.000Z'
    }),
    __metadata("design:type", Date)
], ProjectResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '마지막 조회 일시',
        example: '2024-01-15T10:30:00.000Z'
    }),
    __metadata("design:type", Date)
], ProjectResponseDto.prototype, "lastViewedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 삭제 여부',
        example: false
    }),
    __metadata("design:type", Boolean)
], ProjectResponseDto.prototype, "isDeleted", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 참여자 목록',
        example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']
    }),
    __metadata("design:type", Array)
], ProjectResponseDto.prototype, "participants", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 씬 목록',
        example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']
    }),
    __metadata("design:type", Array)
], ProjectResponseDto.prototype, "scenes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 장르',
        example: '일반'
    }),
    __metadata("design:type", Array)
], ProjectResponseDto.prototype, "genre", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 예상 지속 시간',
        example: '90분'
    }),
    __metadata("design:type", String)
], ProjectResponseDto.prototype, "estimatedDuration", void 0);
class CreateStoryResponseDto {
    story;
}
exports.CreateStoryResponseDto = CreateStoryResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '스토리',
        example: '상세한 스토리 내용...'
    }),
    __metadata("design:type", String)
], CreateStoryResponseDto.prototype, "story", void 0);
//# sourceMappingURL=response.dto.js.map