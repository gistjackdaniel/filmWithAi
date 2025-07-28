import { Controller, Post, Get, Body, Delete, UseGuards, UnauthorizedException, UsePipes, ValidationPipe } from '@nestjs/common';
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

  @Post('login')
  @ApiOperation({ summary: 'Google OAuth 로그인' })
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