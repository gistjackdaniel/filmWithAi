import { Injectable, UnauthorizedException, HttpException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GoogleUserInfo } from './interface/google-user-info';
import { RefreshToken } from './interface/refresh-token';
import { ProfileService } from 'src/profile/profile.service';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { AccessToken } from './interface/access-token';
import { LoginRequestDto, RefreshAccessTokenRequestDto, WithdrawRequestDto } from './dto/request.dto';
import { LoginResponseDto, RefreshAccessTokenResponseDto, WithdrawResponseDto } from './dto/response.dto';

const mockUserInfo: GoogleUserInfo = {
  id: 'test_user_id',
  email: 'test@example.com',
  verified_email: true,
  name: 'Test User',
  given_name: 'Test',
  family_name: 'User',
  picture: 'https://example.com/test-avatar.jpg',
  locale: 'ko',
}


@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly profileService: ProfileService,
  ) {}

  private async generateAccessToken(profileId: string, userInfo: GoogleUserInfo): Promise<string> {
    // profileId 조회
    return this.jwtService.signAsync({
      userId: userInfo.id,
      email: userInfo.email,
      profileId: profileId,
    }, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN') || '24h',
    });
  }

  private async generateRefreshToken(profileId: string, userInfo: GoogleUserInfo): Promise<string> {
    return this.jwtService.signAsync({
      userId: userInfo.id,
      email: userInfo.email,
      profileId: profileId,
    }, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
    });
  } 

  private async validateAccessToken(accessToken: string): Promise<AccessToken> {
    return this.jwtService.verifyAsync<AccessToken>(accessToken, {
      secret: this.configService.get('JWT_SECRET')
    });
  }

  private async validateRefreshToken(refreshToken: string): Promise<RefreshToken> {
    return this.jwtService.verifyAsync<RefreshToken>(refreshToken, {
      secret: this.configService.get('JWT_SECRET')
    });
  }

  private async getGoogleUserInfo(access_token: string): Promise<GoogleUserInfo> {
    try {
      const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });

      if (userInfoResponse.status !== 200) {
        throw new UnauthorizedException('Google OAuth authentication failed');
      }

      const userInfo: GoogleUserInfo = userInfoResponse.data as GoogleUserInfo;
      return userInfo;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // 실제 status code와 메시지 전달
        throw new HttpException(
          error.response.data?.error?.message || error.response.statusText || 'Google OAuth 인증 실패',
          error.response.status
        );
      }
      // 네트워크 등 기타 에러
      throw new InternalServerErrorException('Google OAuth 인증 중 서버 오류');
    }
  }

  async loginTest(loginRequestDto: LoginRequestDto): Promise<LoginResponseDto> {
    const { access_token } = loginRequestDto;

    const userInfo: GoogleUserInfo = mockUserInfo;

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

  async login(loginRequestDto: LoginRequestDto): Promise<LoginResponseDto> {
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

  async refreshAccessToken(refreshAccessTokenRequestDto: RefreshAccessTokenRequestDto): Promise<RefreshAccessTokenResponseDto> {
    const { refresh_token } = refreshAccessTokenRequestDto;
    
    try {
      // refresh token 검증
      const decoded = await this.jwtService.verifyAsync<JwtPayload>(refresh_token, {
        secret: this.configService.get('JWT_SECRET')
      });

      // 새로운 access token 생성
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
    } catch (error) {
      throw new UnauthorizedException('유효하지 않은 refresh token입니다.');
    }
  }

  async withdraw(withdrawRequestDto: WithdrawRequestDto) : Promise<WithdrawResponseDto> {
    await this.profileService.deleteProfile({
      profileId: withdrawRequestDto.profileId,
    });

    return {
      message: '계정이 성공적으로 삭제되었습니다.',
      deletedUserId: withdrawRequestDto.profileId,
    }
  }
} 