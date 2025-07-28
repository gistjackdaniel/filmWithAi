import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    description: '액세스 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  })
  access_token: string;

  @ApiProperty({
    description: '리프레시 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  })
  refresh_token: string;

  @ApiProperty({
    description: '사용자 정보',
    example: {
      _id: '507f1f77bcf86cd799439011',
      googleId: '123456789012345678901',
      email: 'user@example.com',
      name: '김철수',
      picture: 'https://lh3.googleusercontent.com/a/ACg8ocJ...'
    }
  })
  user: {
    _id: string;
    googleId: string;
    email: string;
    name: string;
    picture?: string;
  };
}

export class RefreshAccessTokenResponseDto {
  @ApiProperty({
    description: '새로운 액세스 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  })
  access_token: string;

  @ApiProperty({
    description: '토큰 만료 시간',
    example: '2024-01-16T10:30:00.000Z'
  })
  expires_in: string;
}

export class WithdrawResponseDto {
  @ApiProperty({
    description: '탈퇴 메시지',
    example: '계정이 성공적으로 삭제되었습니다.'
  })
  message: string;

  @ApiProperty({
    description: '삭제된 사용자 ID',
    example: '507f1f77bcf86cd799439011'
  })
  deletedUserId: string;
}
