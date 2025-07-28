import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class ProjectResponseDto {
  @ApiProperty({
    description: '프로젝트 ID',
    example: '507f1f77bcf86cd799439011'
  })
  _id: Types.ObjectId;

  @ApiProperty({
    description: '프로젝트 소유자 ID',
    example: '507f1f77bcf86cd799439011'
  })
  ownerId: Types.ObjectId;

  @ApiProperty({
    description: '프로젝트 제목',
    example: '마법의 모험'
  })
  title: string;

  @ApiProperty({
    description: '프로젝트 시놉시스',
    example: '한 소년이 마법의 세계로 모험을 떠나는 이야기'
  })
  synopsis?: string;

  @ApiProperty({
    description: '프로젝트 스토리',
    example: '상세한 스토리 내용...'
  })
  story?: string;

  @ApiProperty({
    description: '프로젝트 태그',
    example: ['판타지', '모험', '가족']
  })
  tags: string[];

  @ApiProperty({
    description: '프로젝트 공개 여부',
    example: true
  })
  isPublic: boolean;

  @ApiProperty({
    description: '프로젝트 생성 일시',
    example: '2024-01-15T10:30:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: '프로젝트 수정 일시',
    example: '2024-01-15T10:30:00.000Z'
  })
  updatedAt: Date;

  @ApiProperty({
    description: '마지막 조회 일시',
    example: '2024-01-15T10:30:00.000Z'
  })
  lastViewedAt: Date;

  @ApiProperty({
    description: '프로젝트 삭제 여부',
    example: false
  })
  isDeleted: boolean;

  @ApiProperty({
    description: '프로젝트 참여자 목록',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']
  })
  participants: Types.ObjectId[];

  @ApiProperty({
    description: '프로젝트 씬 목록',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']
  })
  scenes: Types.ObjectId[];

  @ApiProperty({
    description: '프로젝트 장르',
    example: '일반'
  })
  genre: string[];

  @ApiProperty({
    description: '프로젝트 예상 지속 시간', 
    example: '90분'
  })
  estimatedDuration: string;
}


export class CreateStoryResponseDto {
  @ApiProperty({
    description: '스토리',
    example: '상세한 스토리 내용...'
  })
  story: string;
}