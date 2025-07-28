import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { ProjectReference } from '../schema/profile.schema';

export class ProfileResponseDto {
  @ApiProperty({
    description: '프로필 ID',
    example: '507f1f77bcf86cd799439011'
  })
  _id: Types.ObjectId;

  @ApiProperty({
    description: 'Google ID',
    example: '123456789012345678901'
  })
  googleId: string;

  @ApiProperty({
    description: '이메일 주소',
    example: 'user@example.com'
  })
  email: string;

  @ApiProperty({
    description: '사용자 이름',
    example: '김철수'
  })
  name: string;

  @ApiProperty({
    description: '프로필 이미지 URL',
    example: 'https://lh3.googleusercontent.com/a/ACg8ocJ...'
  })
  picture?: string;

  @ApiProperty({
    description: '마지막 로그인 시간',
    example: '2024-01-15T10:30:00.000Z'
  })
  lastLoginAt: Date;

  @ApiProperty({
    description: '생성 시간',
    example: '2024-01-15T10:30:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정 시간',
    example: '2024-01-15T10:30:00.000Z'
  })
  updatedAt: Date;

  @ApiProperty({
    description: '프로젝트 목록',
    example: [
      {
        projectId: '507f1f77bcf86cd799439011',
        lastViewedAt: '2024-01-15T10:30:00.000Z',
        isFavorite: true
      }
    ]
  })
  projects: ProjectReference[];
}
