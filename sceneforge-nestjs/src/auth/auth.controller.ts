import { Controller, Post, Get, Body, Delete, UseGuards, UnauthorizedException, UsePipes, ValidationPipe, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { LoginRequestDto, RefreshAccessTokenRequestDto, WithdrawRequestDto } from './dto/request.dto';
import { LoginResponseDto, RefreshAccessTokenResponseDto, WithdrawResponseDto } from './dto/response.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';

@ApiTags('Auth')
@Controller('auth')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @ApiOperation({ summary: 'Google OAuth 시작' })
  async googleAuth() {
    const clientId = this.configService.get('GOOGLE_CLIENT_ID');
    const redirectUri = this.configService.get('GOOGLE_REDIRECT_URI') || 'http://localhost:3002/auth/google/callback';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=email profile&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${Math.random().toString(36).substring(7)}`;

    return { authUrl };
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth 콜백' })
  async googleCallback(@Query('code') code: string, @Query('state') state: string) {
    return this.authService.handleGoogleCallback(code);
  }

  @Post('login')
  @ApiOperation({ summary: 'Google OAuth 로그인 (기존 방식)' })
  @ApiBody({ type: LoginRequestDto })
  async login(@Body() body: LoginRequestDto): Promise<LoginResponseDto> {
    if (body.access_token.startsWith('test_') && this.configService.get('NODE_ENV') === 'development') {
      return this.authService.loginTest(body);
    }
    return this.authService.login(body);
  }

  @Post('refresh')
  @ApiOperation({ summary: '토큰 갱신' })
  @ApiBody({ type: RefreshAccessTokenRequestDto })
  async refreshAccessToken(@Body() refreshAccessTokenRequestDto: RefreshAccessTokenRequestDto) : Promise<RefreshAccessTokenResponseDto> {
    return this.authService.refreshAccessToken(refreshAccessTokenRequestDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '로그아웃' })
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: JwtPayload) {
    return this.authService.logout(user.profileId);
  }

  @Delete('withdraw')
  @ApiBearerAuth()
  @ApiOperation({ summary: '회원 탈퇴' })
  @UseGuards(JwtAuthGuard)
  async withdraw(@CurrentUser() user: JwtPayload) : Promise<WithdrawResponseDto> {
    return this.authService.withdraw({
      profileId: user.profileId,
    });
  }
} 