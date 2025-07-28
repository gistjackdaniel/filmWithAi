import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

// Sub-schemas
export class CameraSettingsResponseDto {
  @ApiProperty({ description: '조리개 값', example: 'f/2.8' })
  aperture: string;

  @ApiProperty({ description: '셔터 스피드', example: '1/60' })
  shutterSpeed: string;

  @ApiProperty({ description: 'ISO 값', example: '800' })
  iso: string;
}

export class SubjectResponseDto {
  @ApiProperty({ description: '피사체 이름', example: '김철수' })
  name: string;

  @ApiProperty({ 
    description: '피사체 타입', 
    enum: ['character', 'object', 'animal', 'background'],
    example: 'character'
  })
  type: string;

  @ApiProperty({ description: '위치', example: '화면 중앙' })
  position: string;

  @ApiProperty({ description: '행동/움직임', example: '천천히 걷기' })
  action: string;

  @ApiProperty({ description: '감정', example: '차분함' })
  emotion: string;

  @ApiProperty({ description: '설명', example: '주인공이 도시 거리를 천천히 걷는 모습' })
  description: string;
}

export class SpecialCinematographyResponseDto {
  @ApiProperty({ description: '드론 촬영 필요 여부', example: false })
  drone: boolean;

  @ApiProperty({ description: '크레인 촬영 필요 여부', example: false })
  crane: boolean;

  @ApiProperty({ description: '집 촬영 필요 여부', example: false })
  jib: boolean;

  @ApiProperty({ description: '수중 촬영 필요 여부', example: false })
  underwater: boolean;

  @ApiProperty({ description: '공중 촬영 필요 여부', example: false })
  aerial: boolean;
}

export class SpecialEffectsResponseDto {
  @ApiProperty({ description: 'VFX 필요 여부', example: false })
  vfx: boolean;

  @ApiProperty({ description: '폭발 효과 필요 여부', example: false })
  pyrotechnics: boolean;

  @ApiProperty({ description: '연기 효과 필요 여부', example: false })
  smoke: boolean;

  @ApiProperty({ description: '안개 효과 필요 여부', example: false })
  fog: boolean;

  @ApiProperty({ description: '바람 효과 필요 여부', example: false })
  wind: boolean;

  @ApiProperty({ description: '비 효과 필요 여부', example: false })
  rain: boolean;

  @ApiProperty({ description: '눈 효과 필요 여부', example: false })
  snow: boolean;

  @ApiProperty({ description: '불 효과 필요 여부', example: false })
  fire: boolean;

  @ApiProperty({ description: '폭발 필요 여부', example: false })
  explosion: boolean;

  @ApiProperty({ description: '스턴트 필요 여부', example: false })
  stunt: boolean;
}

export class SpecialLightingResponseDto {
  @ApiProperty({ description: '레이저 조명 필요 여부', example: false })
  laser: boolean;

  @ApiProperty({ description: '스트로브 조명 필요 여부', example: false })
  strobe: boolean;

  @ApiProperty({ description: '블랙라이트 필요 여부', example: false })
  blackLight: boolean;

  @ApiProperty({ description: 'UV 라이트 필요 여부', example: false })
  uvLight: boolean;

  @ApiProperty({ description: '무빙라이트 필요 여부', example: false })
  movingLight: boolean;

  @ApiProperty({ description: '컬러체인저 필요 여부', example: false })
  colorChanger: boolean;
}

export class SafetyResponseDto {
  @ApiProperty({ description: '의료진 필요 여부', example: false })
  requiresMedic: boolean;

  @ApiProperty({ description: '소방 안전 필요 여부', example: false })
  requiresFireSafety: boolean;

  @ApiProperty({ description: '안전 담당관 필요 여부', example: false })
  requiresSafetyOfficer: boolean;
}

export class SpecialRequirementsResponseDto {
  @ApiProperty({ description: '특수 촬영 요구사항', type: SpecialCinematographyResponseDto })
  specialCinematography: SpecialCinematographyResponseDto;

  @ApiProperty({ description: '특수 효과 요구사항', type: SpecialEffectsResponseDto })
  specialEffects: SpecialEffectsResponseDto;

  @ApiProperty({ description: '특수 조명 요구사항', type: SpecialLightingResponseDto })
  specialLighting: SpecialLightingResponseDto;

  @ApiProperty({ description: '안전 요구사항', type: SafetyResponseDto })
  safety: SafetyResponseDto;
}

export class CameraSetupResponseDto {
  @ApiProperty({ 
    description: '샷 사이즈', 
    enum: [
      'EWS', 'VWS', 'WS', 'FS', 'LS', 'MLS', 'MS', 'MCS', 'CU', 'MCU', 'BCU', 'ECU', 'TCU', 
      'OTS', 'POV', 'TS', 'GS', 'AS', 'PS', 'BS'
    ],
    example: 'MS'
  })
  shotSize: string;

  @ApiProperty({ 
    description: '앵글 방향', 
    enum: [
      'Eye-level', 'High', 'Low', 'Dutch', 'Bird_eye', 'Worm_eye', 'Canted', 'Oblique', 
      'Aerial', 'Ground', 'Overhead', 'Under', 'Side', 'Front', 'Back', 'Three_quarter', 
      'Profile', 'Reverse', 'POV', 'Subjective'
    ],
    example: 'Eye-level'
  })
  angleDirection: string;

  @ApiProperty({ 
    description: '카메라 움직임', 
    enum: [
      'Static', 'Pan', 'Tilt', 'Dolly', 'Zoom', 'Handheld', 'Tracking', 'Crane', 'Steadicam', 
      'Gimbal', 'Drone', 'Jib', 'Slider', 'Dolly_zoom', 'Arc', 'Circle', 'Spiral', 'Vertigo', 
      'Whip_pan', 'Crash_zoom', 'Push_in', 'Pull_out', 'Follow', 'Lead', 'Reveal', 'Conceal', 
      'Parallax', 'Time_lapse', 'Slow_motion', 'Fast_motion', 'Bullet_time', 'Matrix_style', 
      '360_degree', 'VR_style'
    ],
    example: 'Static'
  })
  cameraMovement: string;

  @ApiProperty({ description: '렌즈 사양', example: '50mm f/1.8' })
  lensSpecs: string;

  @ApiProperty({ description: '카메라 설정', type: CameraSettingsResponseDto })
  cameraSettings: CameraSettingsResponseDto;
}

export class CutResponseDto {
  @ApiProperty({ description: '컷 ID', example: '507f1f77bcf86cd799439011' })
  _id: Types.ObjectId;

  @ApiProperty({ description: '씬 ID', example: '507f1f77bcf86cd799439011' })
  sceneId: Types.ObjectId;

  @ApiProperty({ description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' })
  projectId: Types.ObjectId;

  @ApiProperty({ description: '컷 제목', example: 'Shot 1 - 주인공 도시 거리 걷기' })
  title: string;

  @ApiProperty({ description: '컷 설명', example: '주인공이 도시 거리를 천천히 걸으며 주변을 둘러보는 컷' })
  description: string;

  @ApiProperty({ description: '카메라 설정', type: CameraSetupResponseDto })
  cameraSetup: CameraSetupResponseDto;

  @ApiProperty({ description: 'VFX 효과', example: '도시 배경 합성, 안개 효과' })
  vfxEffects: string;

  @ApiProperty({ description: '음향 효과', example: '도시 배경음, 발걸음 소리' })
  soundEffects: string;

  @ApiProperty({ description: '감독 노트', example: '자연스러운 걷기 연기, 주변을 둘러보는 시선 처리' })
  directorNotes: string;

  @ApiProperty({ description: '대사', example: '여기가 바로 그곳이군...' })
  dialogue: string;

  @ApiProperty({ description: '내레이션', example: '그날, 그는 처음으로 이 도시에 발을 들였다' })
  narration: string;

  @ApiProperty({ description: '피사체 움직임', type: [SubjectResponseDto] })
  subjectMovement: SubjectResponseDto[];

  @ApiProperty({ 
    description: '제작 방법', 
    enum: ['live_action', 'ai_generated'],
    example: 'live_action'
  })
  productionMethod: string;

  @ApiProperty({ description: '제작 방법 선택 근거', example: '실사 촬영으로 자연스러운 도시 분위기 연출' })
  productionMethodReason: string;

  @ApiProperty({ description: '예상 지속 시간 (초)', example: 8 })
  estimatedDuration: number;

  @ApiProperty({ description: '특수 요구사항', type: SpecialRequirementsResponseDto })
  specialRequirements: SpecialRequirementsResponseDto;

  @ApiProperty({ description: '이미지 URL', example: 'https://api.example.com/cuts/shot1_preview.jpg' })
  imageUrl?: string;

  @ApiProperty({ description: '순서', example: 1 })
  order: number;

  @ApiProperty({ description: '삭제 여부', example: false })
  isDeleted: boolean;
}