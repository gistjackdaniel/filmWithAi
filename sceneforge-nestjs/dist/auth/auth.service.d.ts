import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ProfileService } from 'src/profile/profile.service';
import { LoginRequestDto, RefreshAccessTokenRequestDto, WithdrawRequestDto } from './dto/request.dto';
import { LoginResponseDto, RefreshAccessTokenResponseDto, WithdrawResponseDto } from './dto/response.dto';
export declare class AuthService {
    private readonly jwtService;
    private readonly configService;
    private readonly profileService;
    constructor(jwtService: JwtService, configService: ConfigService, profileService: ProfileService);
    private generateAccessToken;
    private generateRefreshToken;
    private validateAccessToken;
    private validateRefreshToken;
    private getGoogleUserInfo;
    loginTest(loginRequestDto: LoginRequestDto): Promise<LoginResponseDto>;
    login(loginRequestDto: LoginRequestDto): Promise<LoginResponseDto>;
    refreshAccessToken(refreshAccessTokenRequestDto: RefreshAccessTokenRequestDto): Promise<RefreshAccessTokenResponseDto>;
    withdraw(withdrawRequestDto: WithdrawRequestDto): Promise<WithdrawResponseDto>;
}
