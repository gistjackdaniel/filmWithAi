import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsMongoId } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({
    description: 'Google OAuth 액세스 토큰',
    example: 'ya29.a0AfH6SMC...'
  })
  @IsString()
  @IsNotEmpty()
  access_token: string;
}

export class RefreshAccessTokenRequestDto {
  @ApiProperty({
    description: '리프레시 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}

export class WithdrawRequestDto {
  @ApiProperty({
    description: '탈퇴할 사용자 ID',
    example: '507f1f77bcf86cd799439011'
  })
  @IsMongoId()
  @IsNotEmpty()
  profileId: string;
} 