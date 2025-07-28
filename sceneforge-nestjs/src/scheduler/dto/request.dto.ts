import { IsString, IsOptional, IsMongoId, IsNotEmpty, IsNumber, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SchedulerTimeRangeDto {
  @ApiProperty({ 
    description: '시작 시간',
    example: '09:00'
  })
  @IsString()
  @IsNotEmpty()
  start: string;

  @ApiProperty({ 
    description: '종료 시간',
    example: '17:00'
  })
  @IsString()
  @IsNotEmpty()
  end: string;
}

export class SchedulerSceneDto {
  @ApiProperty({ 
    description: '씬 번호',
    example: 1
  })
  @IsNumber()
  @IsNotEmpty()
  scene: number;

  @ApiProperty({ 
    description: '씬 제목',
    example: '첫 번째 씬'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ 
    description: '씬 설명',
    example: '주인공이 도시에 처음 도착하는 씬'
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ 
    description: '시간대',
    example: '낮',
    enum: ['낮', '밤', '미정']
  })
  @IsString()
  @IsNotEmpty()
  timeOfDay: string;

  @ApiProperty({ 
    description: '캐스트',
    example: {
      role: '주인공',
      name: '홍길동'
    }
  })
  @IsObject()
  @IsNotEmpty()
  cast: {
    role: string;
    name: string;
  };

  @ApiProperty({ 
    description: '예상 지속 시간',
    example: 5
  })
  @IsNumber()
  @IsNotEmpty()
  estimatedDuration: number;

  @ApiProperty({ 
    description: '코스튬',
    example: ['코스튬1', '코스튬2']
  })
  @IsArray()
  @IsNotEmpty()
  costumes: string[];

  @ApiProperty({ 
    description: '속성',
    example: {
      characterProps: ['속성1', '속성2'],
      setProps: ['속성3', '속성4']
    }
  })
  @IsObject()
  @IsNotEmpty()
  props: {
    characterProps: string[];
    setProps: string[];
  };
}

export class CreateSchedulerRequestDto {
  @ApiProperty({ 
    description: '최대 일일 촬영 시간',
    example: 10
  })
  @IsNumber()
  @IsNotEmpty()
  maxDailyHours: number;

  @ApiProperty({ 
    description: '최대 주간 촬영 시간',
    example: 10
  })
  @IsNumber()
  @IsNotEmpty()
  maxWeeklyHours: number;

  @ApiProperty({ 
    description: '휴게 일',
    example: 1
  })
  @IsNumber()
  @IsNotEmpty()
  restDay: number;
}

export class UpdateSchedulerRequestDto {
  @ApiPropertyOptional({ 
    description: '일차',
    example: 1
  })
  @IsNumber()
  @IsOptional()
  day?: number;

  @ApiPropertyOptional({ 
    description: '날짜 표시',
    example: 'Day 1'
  })
  @IsString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ 
    description: '촬영 장소',
    example: '강의실 101'
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ 
    description: '시간대',
    example: '낮',
    enum: ['낮', '밤', '미정']
  })
  @IsString()
  @IsOptional()
  timeOfDay?: string;

  @ApiPropertyOptional({ 
    description: '시간 범위',
    type: SchedulerTimeRangeDto
  })
  @ValidateNested()
  @Type(() => SchedulerTimeRangeDto)
  @IsOptional()
  timeRange?: SchedulerTimeRangeDto;

  @ApiPropertyOptional({ 
    description: '씬 배열',
    type: [SchedulerSceneDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SchedulerSceneDto)
  @IsOptional()
  scenes?: SchedulerSceneDto[];

  @ApiPropertyOptional({ 
    description: '예상 지속 시간 (분)',
    example: 480
  })
  @IsNumber()
  @IsOptional()
  estimatedDuration?: number;

  @ApiPropertyOptional({ 
    description: '브레이크다운 정보',
    example: {
      locations: {},
      actors: {},
      equipment: {}
    }
  })
  @IsObject()
  @IsOptional()
  breakdown?: any;
}

