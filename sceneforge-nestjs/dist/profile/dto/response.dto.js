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
exports.ProfileResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const mongoose_1 = require("mongoose");
class ProfileResponseDto {
    _id;
    googleId;
    email;
    name;
    picture;
    lastLoginAt;
    createdAt;
    updatedAt;
    projects;
}
exports.ProfileResponseDto = ProfileResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로필 ID',
        example: '507f1f77bcf86cd799439011'
    }),
    __metadata("design:type", mongoose_1.Types.ObjectId)
], ProfileResponseDto.prototype, "_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Google ID',
        example: '123456789012345678901'
    }),
    __metadata("design:type", String)
], ProfileResponseDto.prototype, "googleId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '이메일 주소',
        example: 'user@example.com'
    }),
    __metadata("design:type", String)
], ProfileResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '사용자 이름',
        example: '김철수'
    }),
    __metadata("design:type", String)
], ProfileResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로필 이미지 URL',
        example: 'https://lh3.googleusercontent.com/a/ACg8ocJ...'
    }),
    __metadata("design:type", String)
], ProfileResponseDto.prototype, "picture", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '마지막 로그인 시간',
        example: '2024-01-15T10:30:00.000Z'
    }),
    __metadata("design:type", Date)
], ProfileResponseDto.prototype, "lastLoginAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성 시간',
        example: '2024-01-15T10:30:00.000Z'
    }),
    __metadata("design:type", Date)
], ProfileResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정 시간',
        example: '2024-01-15T10:30:00.000Z'
    }),
    __metadata("design:type", Date)
], ProfileResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 목록',
        example: [
            {
                projectId: '507f1f77bcf86cd799439011',
                lastViewedAt: '2024-01-15T10:30:00.000Z',
                isFavorite: true
            }
        ]
    }),
    __metadata("design:type", Array)
], ProfileResponseDto.prototype, "projects", void 0);
//# sourceMappingURL=response.dto.js.map