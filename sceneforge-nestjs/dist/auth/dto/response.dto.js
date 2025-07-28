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
exports.WithdrawResponseDto = exports.RefreshAccessTokenResponseDto = exports.LoginResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class LoginResponseDto {
    access_token;
    refresh_token;
    user;
}
exports.LoginResponseDto = LoginResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '액세스 토큰',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    }),
    __metadata("design:type", String)
], LoginResponseDto.prototype, "access_token", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '리프레시 토큰',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    }),
    __metadata("design:type", String)
], LoginResponseDto.prototype, "refresh_token", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '사용자 정보',
        example: {
            _id: '507f1f77bcf86cd799439011',
            googleId: '123456789012345678901',
            email: 'user@example.com',
            name: '김철수',
            picture: 'https://lh3.googleusercontent.com/a/ACg8ocJ...'
        }
    }),
    __metadata("design:type", Object)
], LoginResponseDto.prototype, "user", void 0);
class RefreshAccessTokenResponseDto {
    access_token;
    expires_in;
}
exports.RefreshAccessTokenResponseDto = RefreshAccessTokenResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '새로운 액세스 토큰',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    }),
    __metadata("design:type", String)
], RefreshAccessTokenResponseDto.prototype, "access_token", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '토큰 만료 시간',
        example: '2024-01-16T10:30:00.000Z'
    }),
    __metadata("design:type", String)
], RefreshAccessTokenResponseDto.prototype, "expires_in", void 0);
class WithdrawResponseDto {
    message;
    deletedUserId;
}
exports.WithdrawResponseDto = WithdrawResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '탈퇴 메시지',
        example: '계정이 성공적으로 삭제되었습니다.'
    }),
    __metadata("design:type", String)
], WithdrawResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '삭제된 사용자 ID',
        example: '507f1f77bcf86cd799439011'
    }),
    __metadata("design:type", String)
], WithdrawResponseDto.prototype, "deletedUserId", void 0);
//# sourceMappingURL=response.dto.js.map