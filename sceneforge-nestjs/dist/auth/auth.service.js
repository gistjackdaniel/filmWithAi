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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const profile_service_1 = require("../profile/profile.service");
const mockUserInfo = {
    id: 'test_user_id',
    email: 'test@example.com',
    verified_email: true,
    name: 'Test User',
    given_name: 'Test',
    family_name: 'User',
    picture: 'https://example.com/test-avatar.jpg',
    locale: 'ko',
};
let AuthService = class AuthService {
    jwtService;
    configService;
    profileService;
    constructor(jwtService, configService, profileService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.profileService = profileService;
    }
    async generateAccessToken(profileId, userInfo) {
        return this.jwtService.signAsync({
            userId: userInfo.id,
            email: userInfo.email,
            profileId: profileId,
        }, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: this.configService.get('JWT_EXPIRES_IN') || '24h',
        });
    }
    async generateRefreshToken(profileId, userInfo) {
        return this.jwtService.signAsync({
            userId: userInfo.id,
            email: userInfo.email,
            profileId: profileId,
        }, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
        });
    }
    async validateAccessToken(accessToken) {
        return this.jwtService.verifyAsync(accessToken, {
            secret: this.configService.get('JWT_SECRET')
        });
    }
    async validateRefreshToken(refreshToken) {
        return this.jwtService.verifyAsync(refreshToken, {
            secret: this.configService.get('JWT_SECRET')
        });
    }
    async getGoogleUserInfo(access_token) {
        try {
            const userInfoResponse = await axios_1.default.get('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });
            if (userInfoResponse.status !== 200) {
                throw new common_1.UnauthorizedException('Google OAuth authentication failed');
            }
            const userInfo = userInfoResponse.data;
            return userInfo;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error) && error.response) {
                throw new common_1.HttpException(error.response.data?.error?.message || error.response.statusText || 'Google OAuth 인증 실패', error.response.status);
            }
            throw new common_1.InternalServerErrorException('Google OAuth 인증 중 서버 오류');
        }
    }
    async loginTest(loginRequestDto) {
        const { access_token } = loginRequestDto;
        const userInfo = mockUserInfo;
        const profile = await this.profileService.createOrUpdateLastLogin({
            googleId: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            lastLoginAt: new Date(),
        });
        const accessToken = await this.generateAccessToken(profile._id.toString(), userInfo);
        const refreshToken = await this.generateRefreshToken(profile._id.toString(), userInfo);
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                _id: profile._id.toString(),
                googleId: userInfo.id,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
            }
        };
    }
    async login(loginRequestDto) {
        const { access_token } = loginRequestDto;
        const userInfo = await this.getGoogleUserInfo(access_token);
        const profile = await this.profileService.createOrUpdateLastLogin({
            googleId: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            lastLoginAt: new Date(),
        });
        const accessToken = await this.generateAccessToken(profile._id.toString(), userInfo);
        const refreshToken = await this.generateRefreshToken(profile._id.toString(), userInfo);
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                _id: profile._id.toString(),
                googleId: userInfo.id,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
            }
        };
    }
    async refreshAccessToken(refreshAccessTokenRequestDto) {
        const { refresh_token } = refreshAccessTokenRequestDto;
        try {
            const decoded = await this.jwtService.verifyAsync(refresh_token, {
                secret: this.configService.get('JWT_SECRET')
            });
            const accessToken = await this.jwtService.signAsync({
                userId: decoded.userId,
                email: decoded.email,
                profileId: decoded.profileId,
            }, {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: this.configService.get('JWT_EXPIRES_IN') || '24h',
            });
            return {
                access_token: accessToken,
                expires_in: this.configService.get('JWT_EXPIRES_IN') || '24h',
            };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('유효하지 않은 refresh token입니다.');
        }
    }
    async withdraw(withdrawRequestDto) {
        await this.profileService.deleteProfile({
            profileId: withdrawRequestDto.profileId,
        });
        return {
            message: '계정이 성공적으로 삭제되었습니다.',
            deletedUserId: withdrawRequestDto.profileId,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        profile_service_1.ProfileService])
], AuthService);
//# sourceMappingURL=auth.service.js.map