import { 
  IsString, 
  IsOptional, 
  IsArray, 
  IsNumber, 
  IsBoolean, 
  IsEnum, 
  ValidateNested, 
  IsMongoId, 
  IsNotEmpty, 
  MaxLength, 
  Min, 
  Max 
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Types } from 'mongoose';

// Sub-schemas
export class CameraSettingsDto {
  @ApiPropertyOptional({ description: '조리개 값', example: 'f/2.8' })
  @IsString()
  @IsOptional()
  aperture?: string;

  @ApiPropertyOptional({ description: '셔터 스피드', example: '1/60' })
  @IsString()
  @IsOptional()
  shutterSpeed?: string;

  @ApiPropertyOptional({ description: 'ISO 값', example: '800' })
  @IsString()
  @IsOptional()
  iso?: string;
}

export class SubjectDto {
  @ApiProperty({ description: '피사체 이름', example: '김철수' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    description: '피사체 타입', 
    enum: ['character', 'object', 'animal', 'background'],
    example: 'character'
  })
  @IsEnum(['character', 'object', 'animal', 'background'])
  type: string;

  @ApiPropertyOptional({ description: '위치', example: '화면 중앙' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  position?: string;

  @ApiPropertyOptional({ description: '행동/움직임', example: '천천히 걷기' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  action?: string;

  @ApiPropertyOptional({ description: '감정', example: '차분함' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  emotion?: string;

  @ApiPropertyOptional({ description: '설명', example: '주인공이 도시 거리를 천천히 걷는 모습' })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  description?: string;
}

export class SpecialCinematographyDto {
  @ApiPropertyOptional({ description: '드론 촬영 필요 여부', example: false })
  @IsBoolean()
  @IsOptional()
  drone?: boolean;

  @ApiPropertyOptional({ description: '크레인 촬영 필요 여부', example: false })
  @IsBoolean()
  @IsOptional()
  crane?: boolean;

  @ApiPropertyOptional({ description: '집 촬영 필요 여부', example: false })
  @IsBoolean()
  @IsOptional()
  jib?: boolean;

  @ApiPropertyOptional({ description: '수중 촬영 필요 여부', example: false })
  @IsBoolean()
  @IsOptional()
  underwater?: boolean;

  @ApiPropertyOptional({ description: '공중 촬영 필요 여부', example: false })
  @IsBoolean()
  @IsOptional()
  aerial?: boolean;
}

export class SpecialEffectsDto {
  @ApiPropertyOptional({ description: 'VFX 필요 여부', example: false })
  @IsBoolean()
  @IsOptional()
  vfx?: boolean;

  @ApiPropertyOptional({ description: '폭발 효과 필요 여부', example: false })
  @IsBoolean()
  @IsOptional()
  pyrotechnics?: boolean;

  @ApiPropertyOptional({ description: '연기 효과 필요 여부', example: false })
  @IsBoolean()
  @IsOptional()
  smoke?: boolean;

  @ApiPropertyOptional({ description: '안개 효과 필요 여부', example: false })
  @IsBoolean()
  @IsOptional()
  fog?: boolean;

  @ApiPropertyOptional({ description: '바람 효과 필요 여부', example: false })
  @IsBoolean()
  @IsOptional()
  wind?: boolean;

  @ApiPropertyOptional({ description: '비 효과 필요 여부', example: false })
  @IsBoolean()
  @IsOptional()
  rain?: boolean;

  @ApiPropertyOptional({ description: '눈 효과 필요 여부', example: false })
  @IsBoolean()
  @IsOptional()
  snow?: boolean;

  @ApiPropertyOptional({ description: '불 효과 필요 여부', example: false })
  @IsBoolean()
  @IsOptional()
  fire?: boolean;

  @ApiPropertyOptional({ description: '폭발 필요 여부', example: false })
  @IsBoolean()
  @IsOptional()
  explosion?: boolean;

  @ApiPropertyOptional({ description: '스턴트 필요 여부', example: false })
  @IsBoolean()
  @IsOptional()
  stunt?: boolean;
}

export class SpecialLightingDto {
  @ApiPropertyOptional({ description: '레이저 조명 필요 여부', example: false })
  @IsBoolean()
  @IsOptional()
  laser?: boolean;

  @ApiPropertyOptional({ description: '스트로브 조명 필요 여부', example: false })
  @IsBoolean()
  @IsOptional()
  strobe?: boolean;

  @ApiPropertyOptional({ description: '블랙라이트 필요 여부', example: false })
  @IsBoolean()
  @IsOptional()
  blackLight?: boolean;

  @ApiPropertyOptional({ description: 'UV 라이트 필요 여부', example: false })
  @IsBoolean()
  @IsOptional()
  uvLight?: boolean;

  @ApiPropertyOptional({ description: '무빙라이트 필요 여부', example: false })
  @IsBoolean()
  @IsOptional()
  movingLight?: boolean;

  @ApiPropertyOptional({ description: '컬러체인저 필요 여부', example: false })
  @IsBoolean()
  @IsOptional()
  colorChanger?: boolean;
}

export class SafetyDto {
  @ApiPropertyOptional({ description: '의료진 필요 여부', example: false })
  @IsBoolean()
  @IsOptional()
  requiresMedic?: boolean;

  @ApiPropertyOptional({ description: '소방 안전 필요 여부', example: false })
  @IsBoolean()
  @IsOptional()
  requiresFireSafety?: boolean;

  @ApiPropertyOptional({ description: '안전 담당관 필요 여부', example: false })
  @IsBoolean()
  @IsOptional()
  requiresSafetyOfficer?: boolean;
}

export class SpecialRequirementsDto {
  @ApiPropertyOptional({ description: '특수 촬영 요구사항', type: SpecialCinematographyDto })
  @ValidateNested()
  @Type(() => SpecialCinematographyDto)
  @IsOptional()
  specialCinematography?: SpecialCinematographyDto;

  @ApiPropertyOptional({ description: '특수 효과 요구사항', type: SpecialEffectsDto })
  @ValidateNested()
  @Type(() => SpecialEffectsDto)
  @IsOptional()
  specialEffects?: SpecialEffectsDto;

  @ApiPropertyOptional({ description: '특수 조명 요구사항', type: SpecialLightingDto })
  @ValidateNested()
  @Type(() => SpecialLightingDto)
  @IsOptional()
  specialLighting?: SpecialLightingDto;

  @ApiPropertyOptional({ description: '안전 요구사항', type: SafetyDto })
  @ValidateNested()
  @Type(() => SafetyDto)
  @IsOptional()
  safety?: SafetyDto;
}

export class CameraSetupDto {
  @ApiPropertyOptional({ 
    description: '샷 사이즈', 
    enum: [
      'EWS', 'VWS', 'WS', 'FS', 'LS', 'MLS', 'MS', 'MCS', 'CU', 'MCU', 'BCU', 'ECU', 'TCU', 
      'OTS', 'POV', 'TS', 'GS', 'AS', 'PS', 'BS'
    ],
    example: 'MS'
  })
  @IsEnum([
    'EWS', 'VWS', 'WS', 'FS', 'LS', 'MLS', 'MS', 'MCS', 'CU', 'MCU', 'BCU', 'ECU', 'TCU', 
    'OTS', 'POV', 'TS', 'GS', 'AS', 'PS', 'BS'
  ])
  @IsOptional()
  shotSize?: string;

  @ApiPropertyOptional({ 
    description: '앵글 방향', 
    enum: [
      'Eye-level', 'High', 'Low', 'Dutch', 'Bird_eye', 'Worm_eye', 'Canted', 'Oblique', 
      'Aerial', 'Ground', 'Overhead', 'Under', 'Side', 'Front', 'Back', 'Three_quarter', 
      'Profile', 'Reverse', 'POV', 'Subjective'
    ],
    example: 'Eye-level'
  })
  @IsEnum([
    'Eye-level', 'High', 'Low', 'Dutch', 'Bird_eye', 'Worm_eye', 'Canted', 'Oblique', 
    'Aerial', 'Ground', 'Overhead', 'Under', 'Side', 'Front', 'Back', 'Three_quarter', 
    'Profile', 'Reverse', 'POV', 'Subjective'
  ])
  @IsOptional()
  angleDirection?: string;

  @ApiPropertyOptional({ 
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
  @IsEnum([
    'Static', 'Pan', 'Tilt', 'Dolly', 'Zoom', 'Handheld', 'Tracking', 'Crane', 'Steadicam', 
    'Gimbal', 'Drone', 'Jib', 'Slider', 'Dolly_zoom', 'Arc', 'Circle', 'Spiral', 'Vertigo', 
    'Whip_pan', 'Crash_zoom', 'Push_in', 'Pull_out', 'Follow', 'Lead', 'Reveal', 'Conceal', 
    'Parallax', 'Time_lapse', 'Slow_motion', 'Fast_motion', 'Bullet_time', 'Matrix_style', 
    '360_degree', 'VR_style'
  ])
  @IsOptional()
  cameraMovement?: string;

  @ApiPropertyOptional({ description: '렌즈 사양', example: '50mm f/1.8', maxLength: 200 })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  lensSpecs?: string;

  @ApiPropertyOptional({ description: '카메라 설정', type: CameraSettingsDto })
  @ValidateNested()
  @Type(() => CameraSettingsDto)
  @IsOptional()
  cameraSettings?: CameraSettingsDto;
}

// Main DTOs
export class CreateCutRequestDto {
  @ApiProperty({
    description: '순서',
    example: 1,
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  order: number;

  @ApiProperty({
    description: '컷 제목',
    example: 'Shot 1 - 주인공 도시 거리 걷기',
    maxLength: 200
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @IsOptional()
  title: string;

  @ApiProperty({
    description: '컷 설명',
    example: '주인공이 도시 거리를 천천히 걸으며 주변을 둘러보는 컷',
    maxLength: 1000
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  @IsOptional()
  description: string;

  @ApiPropertyOptional({ description: '카메라 설정', type: CameraSetupDto })
  @ValidateNested()
  @Type(() => CameraSetupDto)
  @IsOptional()
  cameraSetup?: CameraSetupDto;

  @ApiPropertyOptional({ description: 'VFX 효과', example: '특수 효과 없음', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  vfxEffects?: string;

  @ApiPropertyOptional({ description: '음향 효과', example: '배경음', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  soundEffects?: string;

  @ApiPropertyOptional({ description: '감독 노트', example: '자연스러운 연기 부탁', maxLength: 1000 })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  directorNotes?: string;

  @ApiPropertyOptional({ description: '대사', example: '안녕하세요', maxLength: 200 })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  dialogue?: string;

  @ApiPropertyOptional({ description: '내레이션', example: '그날은 특별한 날이었다', maxLength: 200 })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  narration?: string;

  @ApiPropertyOptional({ description: '피사체 움직임', type: [SubjectDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubjectDto)
  @IsOptional()
  subjectMovement?: SubjectDto[];

  @ApiPropertyOptional({ 
    description: '제작 방법', 
    enum: ['live_action', 'ai_generated'],
    example: 'live_action'
  })
  @IsEnum(['live_action', 'ai_generated'])
  @IsOptional()
  productionMethod?: string;

  @ApiPropertyOptional({ description: '제작 방법 선택 근거', example: '실사 촬영으로 자연스러운 도시 분위기 연출', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  productionMethodReason?: string;

  @ApiPropertyOptional({ 
    description: '예상 지속 시간 (초)', 
    example: 8,
    minimum: 1,
    maximum: 300
  })
  @IsNumber()
  @Min(1)
  @Max(300)
  @IsOptional()
  estimatedDuration?: number;

  @ApiPropertyOptional({ description: '특수 요구사항', type: SpecialRequirementsDto })
  @ValidateNested()
  @Type(() => SpecialRequirementsDto)
  @IsOptional()
  specialRequirements?: SpecialRequirementsDto;

  @ApiPropertyOptional({ description: '이미지 URL', example: 'https://api.example.com/cuts/shot1_preview.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}

export class UpdateCutRequestDto {
  @ApiPropertyOptional({
    description: '컷 제목',
    example: 'Shot 1 - 주인공 도시 거리 걷기 (수정)',
    maxLength: 200
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  @IsNotEmpty()
  title?: string;

  @ApiPropertyOptional({
    description: '컷 설명',
    example: '주인공이 도시 거리를 천천히 걸으며 주변을 둘러보는 컷 (수정됨)',
    maxLength: 1000
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  @IsNotEmpty()
  description?: string;

  @ApiPropertyOptional({ description: '카메라 설정', type: CameraSetupDto })
  @ValidateNested()
  @Type(() => CameraSetupDto)
  @IsOptional()
  cameraSetup?: CameraSetupDto;

  @ApiPropertyOptional({ description: 'VFX 효과', example: '특수 효과 없음', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  vfxEffects?: string;

  @ApiPropertyOptional({ description: '음향 효과', example: '배경음', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  soundEffects?: string;

  @ApiPropertyOptional({ description: '감독 노트', example: '자연스러운 연기 부탁', maxLength: 1000 })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  directorNotes?: string;

  @ApiPropertyOptional({ description: '대사', example: '안녕하세요', maxLength: 200 })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  dialogue?: string;

  @ApiPropertyOptional({ description: '내레이션', example: '그날은 특별한 날이었다', maxLength: 200 })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  narration?: string;

  @ApiPropertyOptional({ description: '피사체 움직임', type: [SubjectDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubjectDto)
  @IsOptional()
  subjectMovement?: SubjectDto[];

  @ApiPropertyOptional({ 
    description: '제작 방법', 
    enum: ['live_action', 'ai_generated'],
    example: 'live_action'
  })
  @IsEnum(['live_action', 'ai_generated'])
  @IsOptional()
  productionMethod?: string;

  @ApiPropertyOptional({ description: '제작 방법 선택 근거', example: '실사 촬영이 더 자연스럽다', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  productionMethodReason?: string;

  @ApiPropertyOptional({ 
    description: '예상 지속 시간 (초)', 
    example: 5,
    minimum: 1,
    maximum: 300
  })
  @IsNumber()
  @Min(1)
  @Max(300)
  @IsOptional()
  estimatedDuration?: number;

  @ApiPropertyOptional({ description: '특수 요구사항', type: SpecialRequirementsDto })
  @ValidateNested()
  @Type(() => SpecialRequirementsDto)
  @IsOptional()
  specialRequirements?: SpecialRequirementsDto;

  @ApiPropertyOptional({ description: '이미지 URL', example: 'https://example.com/image.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: '순서', example: 0 })
  @IsNumber()
  @IsOptional()
  order?: number;
}

export class CreateCutDraftRequestDto {
  @ApiProperty({
    description: '최대 컷 수',
    example: 1,
    minimum: 1,
    maximum: 10
  })
  @IsNumber()
  @Min(1)
  @Max(10)
  maxCuts: number;
}

export class UploadImageDto {
  @ApiProperty({
    description: '이미지 파일',
    type: 'string',
    format: 'binary'
  })
  @IsNotEmpty()
  file: Express.Multer.File;
}