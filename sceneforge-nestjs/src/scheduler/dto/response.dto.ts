import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class SchedulerTimeRangeResponseDto {
  @ApiProperty({ 
    description: '시작 시간',
    example: '09:00'
  })
  start: string;

  @ApiProperty({ 
    description: '종료 시간',
    example: '17:00'
  })
  end: string;
}

export class SchedulerSceneResponseDto {
  @ApiProperty({ 
    description: '씬 번호',
    example: 1
  })
  scene: number;

  @ApiProperty({ 
    description: '씬 제목',
    example: '첫 번째 씬'
  })
  title: string;

  @ApiProperty({ 
    description: '씬 설명',
    example: '주인공이 도시에 처음 도착하는 씬'
  })
  description: string;

  @ApiProperty({ 
    description: '시간대',
    example: '낮'
  })
  timeOfDay: string;

  @ApiProperty({ 
    description: '예상 지속 시간',
    example: '5분'
  })
  estimatedDuration: number;

  @ApiProperty({  
    description: '캐스트',
    example: {
      role: '주인공',
      name: '홍길동'
    }
  })
  cast: {
    role: string;
    name: string;
  };

  @ApiProperty({ 
    description: '코스튬',
    example: ['코스튬1', '코스튬2']
  })
  costumes: string[];

  @ApiProperty({ 
    description: '속성',
    example: {
      characterProps: ['속성1', '속성2'],
      setProps: ['속성3', '속성4']
    }
  })
  props: {
    characterProps: string[];
    setProps: string[];
  };
}

export class SchedulerResponseDto {
  @ApiProperty({ 
    description: '스케줄러 ID',
    example: '507f1f77bcf86cd799439011'
  })
  _id: Types.ObjectId;

  @ApiProperty({ 
    description: '프로젝트 ID',
    example: '507f1f77bcf86cd799439011'
  })
  projectId: Types.ObjectId;

  @ApiProperty({ 
    description: '일차',
    example: 1
  })
  day: number;

  @ApiProperty({ 
    description: '날짜 표시',
    example: 'Day 1'
  })
  date: string;

  @ApiProperty({ 
    description: '촬영 장소',
    example: '강의실 101'
  })
  location_groups: string[];

  @ApiProperty({ 
    description: '시간 범위',
    type: SchedulerTimeRangeResponseDto
  })
  timeRange: SchedulerTimeRangeResponseDto;

  @ApiProperty({ 
    description: '씬 배열',
    type: [SchedulerSceneResponseDto]
  })
  scenes: SchedulerSceneResponseDto[];

  @ApiProperty({ 
    description: '예상 지속 시간 (분)',
    example: 480
  })
  estimatedDuration: number;

  @ApiProperty({ 
    description: '브레이크다운 정보',
    example: {
      locations: {},
      actors: {},
      equipment: {}
    }
  })
  breakdown: any;

  @ApiProperty({ 
    description: '삭제 여부',
    example: false
  })
  isDeleted: boolean;
} 