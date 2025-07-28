import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsBoolean, IsDate, IsString, IsEmail, IsOptional, IsMongoId } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateProfileRequestDto {
  @ApiProperty({
    description: 'Google ID',
    example: '123456789012345678901'
  })
  @IsString()
  @IsNotEmpty()
  googleId: string;

  @ApiProperty({
    description: '이메일 주소',
    example: 'user@example.com'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: '사용자 이름',
    example: '김철수'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '프로필 이미지 URL',
    example: 'https://lh3.googleusercontent.com/a/ACg8ocJ...'
  })
  @IsString()
  @IsNotEmpty()
  picture: string;
  
  @ApiProperty({
    description: '마지막 로그인 시간',
    example: '2024-01-15T10:30:00.000Z'
  })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  lastLoginAt: Date;
}

export class UpdateProfileRequestDto {
  @ApiPropertyOptional({
    description: 'Google ID',
    example: '123456789012345678901'
  })
  @IsString()
  @IsOptional()
  googleId?: string;

  @ApiPropertyOptional({
    description: '이메일 주소',
    example: 'user@example.com'
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: '사용자 이름',
    example: '김철수'
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: '프로필 이미지 URL',
    example: 'https://lh3.googleusercontent.com/a/ACg8ocJ...'
  })
  @IsString()
  @IsOptional()
  picture?: string;
  
  @ApiPropertyOptional({
    description: '마지막 로그인 시간',
    example: '2024-01-15T10:30:00.000Z'
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  lastLoginAt?: Date;
}

export class FindProfileRequestDto {
  @ApiPropertyOptional({
    description: '프로필 ID',
    example: '507f1f77bcf86cd799439011'
  })
  @IsMongoId()
  @IsOptional()
  profileId?: string;

  @ApiPropertyOptional({
    description: 'Google ID',
    example: '123456789012345678901'
  })
  @IsString()
  @IsOptional()
  googleId?: string;

  @ApiPropertyOptional({
    description: '이메일 주소',
    example: 'user@example.com'
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: '사용자 이름',
    example: '김철수'
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: '페이지 번호',
    example: 1,
    default: 1
  })
  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: '페이지당 항목 수',
    example: 10,
    default: 10
  })
  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  limit?: number = 10;
}

export class DeleteProfileRequestDto {
  @ApiProperty({
    description: '삭제할 프로필 ID',
    example: '507f1f77bcf86cd799439011'
  })
  @IsMongoId()
  @IsNotEmpty()
  profileId: string;
} 