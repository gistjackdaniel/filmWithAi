import { IsString, IsOptional, IsArray, IsBoolean, IsNotEmpty, IsNumber, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateProjectRequestDto {
  @ApiProperty({
    description: '프로젝트 제목',
    example: '마법의 모험',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: '프로젝트 시놉시스',
    example: '한 소년이 마법의 세계로 모험을 떠나는 이야기',
    required: false,
  })
  @IsOptional()
  @IsString()
  synopsis?: string;

  @ApiPropertyOptional({
    description: '스토리 내용',
    example: '상세한 스토리 내용...',
    required: false,
  })
  @IsOptional()
  @IsString()
  story?: string;

  @ApiProperty({
    description: '프로젝트 태그',
    example: ['판타지', '모험', '가족'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiPropertyOptional({
    description: '공개 여부',
    example: false,
    required: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({
    description: '장르',
    example: ['드라마', '모험', '가족'],
  })
  @IsArray()
  @IsString({ each: true })
  genre: string[];

  @ApiPropertyOptional({
    description: '예상 지속 시간',
    example: '90분',
    required: false,
  })
  @IsString()
  estimatedDuration?: string;
} 

export class FindProjectDetailRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: '프로필 ID',
    example: '60a75b1b5b1b1b1b1b1b1b1b',
  })
  profileId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: '프로젝트 ID',
    example: '60a75b1b5b1b1b1b1b1b1b1b',
  })
  _id: string;
}

export class PullFavoriteRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: '프로필 ID',
    example: '60a75b1b5b1b1b1b1b1b1b1b',
  })
  profileId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: '프로젝트 ID',
    example: '60a75b1b5b1b1b1b1b1b1b1b',
  })
  projectId: string;
}

export class PushFavoriteRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: '프로필 ID',
    example: '60a75b1b5b1b1b1b1b1b1b1b',
  })
  profileId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: '프로젝트 ID',
    example: '60a75b1b5b1b1b1b1b1b1b1b',
  })
  projectId: string;
}

export class SearchProjectRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: '프로필 ID',
    example: '60a75b1b5b1b1b1b1b1b1b1b',
  })
  profileId: string;
}

export class UpdateProjectRequestDto extends PartialType(CreateProjectRequestDto) {} 

export class DeleteProjectRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: '프로필 ID',
    example: '60a75b1b5b1b1b1b1b1b1b1b',
  })
  profileId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: '프로젝트 ID',
    example: '60a75b1b5b1b1b1b1b1b1b1b',
  })
  _id: string;
}

export class RestoreProjectRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: '프로필 ID',
    example: '60a75b1b5b1b1b1b1b1b1b1b',
  })
  profileId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: '프로젝트 ID',
    example: '60a75b1b5b1b1b1b1b1b1b1b',
  })
  projectId: string;
}
