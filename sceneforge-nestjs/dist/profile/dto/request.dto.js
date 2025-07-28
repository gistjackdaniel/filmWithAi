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
exports.DeleteProfileRequestDto = exports.FindProfileRequestDto = exports.UpdateProfileRequestDto = exports.CreateProfileRequestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateProfileRequestDto {
    googleId;
    email;
    name;
    picture;
    lastLoginAt;
}
exports.CreateProfileRequestDto = CreateProfileRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Google ID',
        example: '123456789012345678901'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateProfileRequestDto.prototype, "googleId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '이메일 주소',
        example: 'user@example.com'
    }),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateProfileRequestDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '사용자 이름',
        example: '김철수'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateProfileRequestDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로필 이미지 URL',
        example: 'https://lh3.googleusercontent.com/a/ACg8ocJ...'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateProfileRequestDto.prototype, "picture", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '마지막 로그인 시간',
        example: '2024-01-15T10:30:00.000Z'
    }),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Date)
], CreateProfileRequestDto.prototype, "lastLoginAt", void 0);
class UpdateProfileRequestDto {
    googleId;
    email;
    name;
    picture;
    lastLoginAt;
}
exports.UpdateProfileRequestDto = UpdateProfileRequestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Google ID',
        example: '123456789012345678901'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProfileRequestDto.prototype, "googleId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '이메일 주소',
        example: 'user@example.com'
    }),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProfileRequestDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '사용자 이름',
        example: '김철수'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProfileRequestDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로필 이미지 URL',
        example: 'https://lh3.googleusercontent.com/a/ACg8ocJ...'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProfileRequestDto.prototype, "picture", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '마지막 로그인 시간',
        example: '2024-01-15T10:30:00.000Z'
    }),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], UpdateProfileRequestDto.prototype, "lastLoginAt", void 0);
class FindProfileRequestDto {
    profileId;
    googleId;
    email;
    name;
    page = 1;
    limit = 10;
}
exports.FindProfileRequestDto = FindProfileRequestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로필 ID',
        example: '507f1f77bcf86cd799439011'
    }),
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FindProfileRequestDto.prototype, "profileId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Google ID',
        example: '123456789012345678901'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FindProfileRequestDto.prototype, "googleId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '이메일 주소',
        example: 'user@example.com'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FindProfileRequestDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '사용자 이름',
        example: '김철수'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FindProfileRequestDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '페이지 번호',
        example: 1,
        default: 1
    }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], FindProfileRequestDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '페이지당 항목 수',
        example: 10,
        default: 10
    }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], FindProfileRequestDto.prototype, "limit", void 0);
class DeleteProfileRequestDto {
    profileId;
}
exports.DeleteProfileRequestDto = DeleteProfileRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '삭제할 프로필 ID',
        example: '507f1f77bcf86cd799439011'
    }),
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DeleteProfileRequestDto.prototype, "profileId", void 0);
//# sourceMappingURL=request.dto.js.map