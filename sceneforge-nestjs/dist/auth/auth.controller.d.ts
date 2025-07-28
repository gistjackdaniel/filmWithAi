import { AuthService } from './auth.service';
import { LoginRequestDto, RefreshAccessTokenRequestDto } from './dto/request.dto';
import { LoginResponseDto, RefreshAccessTokenResponseDto, WithdrawResponseDto } from './dto/response.dto';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';
export declare class AuthController {
    private readonly authService;
    private readonly configService;
    constructor(authService: AuthService, configService: ConfigService);
    login(body: LoginRequestDto): Promise<LoginResponseDto>;
    refreshAccessToken(refreshAccessTokenRequestDto: RefreshAccessTokenRequestDto): Promise<RefreshAccessTokenResponseDto>;
    withdraw(user: JwtPayload): Promise<WithdrawResponseDto>;
}
