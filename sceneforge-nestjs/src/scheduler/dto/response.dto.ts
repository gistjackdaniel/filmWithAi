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
  estimatedDuration: string;

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

export class SchedulerDayResponseDto {
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
    example: []
  })
  breakdown: any[];

  @ApiProperty({ 
    description: '삭제 여부',
    example: false
  })
  isDeleted: boolean;
} 

export class SchedulerResponseDto {
  @ApiProperty({ 
    description: '스케줄러 ID',
    example: '507f1f77bcf86cd799439011'
  })
  _id: Types.ObjectId;

  @ApiProperty({ 
    description: '스케줄러 일일 배열',
    type: [SchedulerDayResponseDto]
  })
  days: SchedulerDayResponseDto[];

  @ApiProperty({ 
    description: '총 일수',
    example: 10
  })
  totalDays: number;

  @ApiProperty({ 
    description: '총 씬 수',
    example: 10
  })
  totalScenes: number;

  @ApiProperty({ 
    description: '총 촬영 시간',
    example: 10
  })
  totalDuration: number;
}

// Breakdown 관련 DTO들
export class BreakdownBasicInfoDto {
  @ApiProperty({ 
    description: '프로젝트 제목',
    example: '영화 제목'
  })
  projectTitle: string;

  @ApiProperty({ 
    description: '촬영 회차',
    example: 'Day 1'
  })
  shootNumber: string;

  @ApiProperty({ 
    description: '촬영 날짜',
    example: 'Day 1'
  })
  date: string;

  @ApiProperty({ 
    description: '요일',
    example: '월요일'
  })
  dayOfWeek: string;

  @ApiProperty({ 
    description: '날씨',
    example: '맑음'
  })
  weather: string;

  @ApiProperty({ 
    description: '온도 정보'
  })
  temperature: {
    max: number;
    min: number;
  };

  @ApiProperty({ 
    description: '비올 확률'
  })
  rainProbability: {
    morning: number | null;
    afternoon: number | null;
  };

  @ApiProperty({ 
    description: '일출 시간',
    example: '06:00'
  })
  sunrise: string | null;

  @ApiProperty({ 
    description: '일몰 시간',
    example: '18:00'
  })
  sunset: string | null;

  @ApiProperty({ 
    description: '문서 정보'
  })
  documentInfo: {
    fix: string | null;
    writer: string | null;
  };
}

export class BreakdownContactInfoDto {
  @ApiProperty({ 
    description: '제작자 정보'
  })
  producer: { name: string | null; contact: string | null };

  @ApiProperty({ 
    description: '제작 매니저 정보'
  })
  productionManager: { name: string | null; contact: string | null };

  @ApiProperty({ 
    description: '조감독 정보'
  })
  assistantDirector: { name: string | null; contact: string | null };

  @ApiProperty({ 
    description: '감독 정보'
  })
  director: { name: string | null; contact: string | null };

  @ApiProperty({ 
    description: '부서별 연락처'
  })
  departments: {
    direction: Record<string, any>;
    production: Record<string, any>;
    art: Record<string, any>;
    cinematography: Record<string, any>;
    lighting: Record<string, any>;
    sound: Record<string, any>;
    costume: Record<string, any>;
    makeup: Record<string, any>;
    props: Record<string, any>;
  };
}

export class BreakdownSceneDetailsDto {
  @ApiProperty({ 
    description: '씬 목록'
  })
  sceneList: Array<{
    sceneNumber: number;
    location: string;
    timeOfDay: string;
    sceneType: string;
    cutCount: number;
    description: string;
    mainCast: string[];
    supportingCast: string[];
    extras: string[];
    notes: string;
  }>;

  @ApiProperty({ 
    description: '씬 요약'
  })
  sceneSummary: {
    totalScenes: number;
    totalCuts: number;
    locations: string[];
    timeSlots: string[];
  };
}

export class BreakdownMeetingInfoDto {
  @ApiProperty({ 
    description: '집합 시간',
    example: '06:00'
  })
  meetingTime: string | null;

  @ApiProperty({ 
    description: '집합 장소',
    example: '촬영장'
  })
  meetingLocation: string | null;

  @ApiProperty({ 
    description: '집합 지점들'
  })
  meetingPoints: Array<{
    order: number;
    time: string;
    location: string;
    description: string;
  }>;
}

export class BreakdownTimeTableDto {
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
    description: '시작 시간',
    example: '09:00'
  })
  startTime: string;

  @ApiProperty({ 
    description: '종료 시간',
    example: '10:00'
  })
  endTime: string;

  @ApiProperty({ 
    description: '촬영 시간 (분)',
    example: 60
  })
  duration: number;

  @ApiProperty({ 
    description: '휴식 시간 (분)',
    example: 30
  })
  breakTime: number;

  @ApiProperty({ 
    description: '총 시간 (분)',
    example: 90
  })
  totalTime: number;

  @ApiProperty({ 
    description: '씬 설명',
    example: '주인공이 도시에 처음 도착하는 씬'
  })
  description: string;

  @ApiProperty({ 
    description: '시간대',
    example: '낮'
  })
  timeSlot: string;
}

export class BreakdownResponseDto {
  @ApiProperty({ 
    description: '기본 정보',
    type: BreakdownBasicInfoDto
  })
  basicInfo: BreakdownBasicInfoDto;

  @ApiProperty({ 
    description: '연락처 정보',
    type: BreakdownContactInfoDto
  })
  contacts: BreakdownContactInfoDto;

  @ApiProperty({ 
    description: '씬 상세 정보',
    type: BreakdownSceneDetailsDto
  })
  sceneDetails: BreakdownSceneDetailsDto;

  @ApiProperty({ 
    description: '장소별 분류'
  })
  locations: Record<string, any[]>;

  @ApiProperty({ 
    description: '배우별 분류'
  })
  actors: Record<string, any[]>;

  @ApiProperty({ 
    description: '시간대별 분류'
  })
  timeSlots: Record<string, any[]>;

  @ApiProperty({ 
    description: '장비별 분류'
  })
  equipment: {
    direction: Record<string, any[]>;
    production: Record<string, any[]>;
    cinematography: Record<string, any[]>;
    lighting: Record<string, any[]>;
    sound: Record<string, any[]>;
    art: Record<string, any[]>;
  };

  @ApiProperty({ 
    description: '인력별 분류'
  })
  crew: {
    direction: Record<string, any[]>;
    production: Record<string, any[]>;
    cinematography: Record<string, any[]>;
    lighting: Record<string, any[]>;
    sound: Record<string, any[]>;
    art: Record<string, any[]>;
  };

  @ApiProperty({ 
    description: '소품별 분류'
  })
  props: Record<string, any[]>;

  @ApiProperty({ 
    description: '의상별 분류'
  })
  costumes: Record<string, any[]>;

  @ApiProperty({ 
    description: '카메라별 분류'
  })
  cameras: Record<string, any[]>;

  @ApiProperty({ 
    description: '요약 정보'
  })
  summary: {
    totalScenes: number;
    totalDuration: number;
  };

  @ApiProperty({ 
    description: '집합 정보',
    type: BreakdownMeetingInfoDto
  })
  meetingInfo: BreakdownMeetingInfoDto;

  @ApiProperty({ 
    description: '타임 테이블',
    type: [BreakdownTimeTableDto]
  })
  timeTable: BreakdownTimeTableDto[];
}