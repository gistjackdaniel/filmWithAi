import { IsString, IsOptional, IsArray, IsNumber, IsBoolean, IsDate, IsEnum, ValidateNested, IsMongoId, IsNotEmpty, MaxLength, MinLength, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Import interfaces
import { Dialogue } from '../interface/dialogue.interface';
import { LightSetup } from '../interface/light-setup.interface';
import { GripModifier } from '../interface/grip-modifier.interface';
import { LightOverall } from '../interface/light-overall.interface';
import { LightingSetup } from '../interface/lighting-setup.interface';
import { Lighting } from '../interface/lighting.interface';
import { RealLocation } from '../interface/scene-location.interface';
import { CrewRole } from '../interface/crew-role.interface';
import { Production } from '../interface/production.interface';
import { Cinematography } from '../interface/cinematography.interface';
import { LightingCrew } from '../interface/lighting-crew.interface';
import { Sound } from '../interface/sound.interface';
import { Art } from '../interface/art.interface';
import { Crew } from '../interface/crew.interface';
import { DirectionEquipment } from '../interface/direction-equipment.interface';
import { ProductionEquipment } from '../interface/production-equipment.interface';
import { CinematographyEquipment } from '../interface/cinematography-equipment.interface';
import { LightingEquipment } from '../interface/lighting-equipment.interface';
import { SoundEquipment } from '../interface/sound-equipment.interface';
import { ArtProps } from '../interface/art-props.interface';
import { ArtEquipment } from '../interface/art-equipment.interface';
import { CrewMember } from '../interface/crew-memeber.interface';
import { CastMember } from '../interface/cast-member.interface';
import { ExtraMember } from '../interface/extra-member.interface';

// DTO classes for validation
export class DialogueDto implements Dialogue {
  @ApiPropertyOptional({ 
    description: '대화하는 캐릭터 이름',
    example: '김철수',
    maxLength: 100
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  character?: string;

  @ApiPropertyOptional({ 
    description: '대화 내용',
    example: '여기가 바로 그곳이군... 정말 예쁘네.',
    maxLength: 1000
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  text?: string;
}

export class LightSetupDto implements LightSetup {
  @ApiPropertyOptional({ 
    description: '조명 타입',
    example: 'HMI',
    maxLength: 100
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  type?: string;

  @ApiPropertyOptional({ 
    description: '조명 장비',
    example: 'Arri M18',
    maxLength: 100
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  equipment?: string;

  @ApiPropertyOptional({ 
    description: '조명 강도',
    example: '18K',
    maxLength: 100
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  intensity?: string;
}

export class GripModifierDto implements GripModifier {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  flags?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  diffusion?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  reflectors?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  colorGels?: string[];
}

export class LightOverallDto implements LightOverall {
  @IsString()
  @IsOptional()
  colorTemperature?: string;

  @IsString()
  @IsOptional()
  mood?: string;
}

export class LightingSetupDto implements LightingSetup {
  @ValidateNested()
  @Type(() => LightSetupDto)
  @IsOptional()
  keyLight?: LightSetupDto;

  @ValidateNested()
  @Type(() => LightSetupDto)
  @IsOptional()
  fillLight?: LightSetupDto;

  @ValidateNested()
  @Type(() => LightSetupDto)
  @IsOptional()
  backLight?: LightSetupDto;

  @ValidateNested()
  @Type(() => LightSetupDto)
  @IsOptional()
  backgroundLight?: LightSetupDto;

  @ValidateNested()
  @Type(() => LightSetupDto)
  @IsOptional()
  specialEffects?: LightSetupDto;

  @ValidateNested()
  @Type(() => LightSetupDto)
  @IsOptional()
  softLight?: LightSetupDto;

  @ValidateNested()
  @Type(() => GripModifierDto)
  @IsOptional()
  gripModifier?: GripModifierDto;

  @ValidateNested()
  @Type(() => LightOverallDto)
  @IsOptional()
  overall?: LightOverallDto;
}

export class LightingDto implements Lighting {
  @IsString()
  @IsOptional()
  description?: string;

  @ValidateNested()
  @Type(() => LightingSetupDto)
  @IsOptional()
  setup?: LightingSetupDto;
}

export class RealLocationDto implements RealLocation {
  @ApiPropertyOptional({ 
    description: '위치 이름',
    example: '서울 강남구 테헤란로'
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ 
    description: '실제 주소',
    example: '서울특별시 강남구 테헤란로 123'
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ 
    description: '위치 그룹명',
    example: '강남구 촬영지'
  })
  @IsString()
  @IsOptional()
  group_name?: string;
}

export class CrewRoleDto implements CrewRole {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  @IsOptional()
  director?: CrewMemberDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  @IsOptional()
  assistantDirector?: CrewMemberDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  @IsOptional()
  scriptSupervisor?: CrewMemberDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  @IsOptional()
  continuity?: CrewMemberDto[];
}

export class ProductionDto implements Production {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  @IsOptional()
  producer?: CrewMemberDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  @IsOptional()
  lineProducer?: CrewMemberDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  @IsOptional()
  productionManager?: CrewMemberDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  @IsOptional()
  productionAssistant?: CrewMemberDto[];
}

export class CinematographyDto implements Cinematography {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  @IsOptional()
  cinematographer?: CrewMemberDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  @IsOptional()
  cameraOperator?: CrewMemberDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  @IsOptional()
  firstAssistant?: CrewMemberDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  @IsOptional()
  secondAssistant?: CrewMemberDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  @IsOptional()
  dollyGrip?: CrewMemberDto[];
}

export class LightingCrewDto implements LightingCrew {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  @IsOptional()
  gaffer?: CrewMemberDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  @IsOptional()
  bestBoy?: CrewMemberDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  @IsOptional()
  electrician?: CrewMemberDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  @IsOptional()
  generatorOperator?: CrewMemberDto[];
}

export class SoundDto implements Sound {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  @IsOptional()
  soundMixer?: CrewMemberDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  @IsOptional()
  boomOperator?: CrewMemberDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  @IsOptional()
  soundAssistant?: CrewMemberDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  @IsOptional()
  utility?: CrewMemberDto[];
}

export class ArtDto implements Art {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  @IsOptional()
  productionDesigner?: CrewMemberDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  @IsOptional()
  artDirector?: CrewMemberDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  @IsOptional()
  setDecorator?: CrewMemberDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  @IsOptional()
  propMaster?: CrewMemberDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  @IsOptional()
  makeupArtist?: CrewMemberDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  @IsOptional()
  costumeDesigner?: CrewMemberDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  @IsOptional()
  hairStylist?: CrewMemberDto[];
}

export class CrewDto implements Crew {
  @ValidateNested()
  @Type(() => CrewRoleDto)
  @IsOptional()
  direction?: CrewRoleDto;

  @ValidateNested()
  @Type(() => ProductionDto)
  @IsOptional()
  production?: ProductionDto;

  @ValidateNested()
  @Type(() => CinematographyDto)
  @IsOptional()
  cinematography?: CinematographyDto;

  @ValidateNested()
  @Type(() => LightingCrewDto)
  @IsOptional()
  lighting?: LightingCrewDto;

  @ValidateNested()
  @Type(() => SoundDto)
  @IsOptional()
  sound?: SoundDto;

  @ValidateNested()
  @Type(() => ArtDto)
  @IsOptional()
  art?: ArtDto;
}

export class DirectionEquipmentDto implements DirectionEquipment {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  monitors?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  communication?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  scriptBoards?: string[];
}

export class ProductionEquipmentDto implements ProductionEquipment {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  scheduling?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  safety?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  transportation?: string[];
}

export class CinematographyEquipmentDto implements CinematographyEquipment {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  cameras?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  lenses?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  supports?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  filters?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  accessories?: string[];
}

export class LightingEquipmentDto implements LightingEquipment {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keyLights?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fillLights?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  backLights?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  backgroundLights?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specialEffectsLights?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  softLights?: string[];

  @ValidateNested()
  @Type(() => GripModifierDto)
  @IsOptional()
  gripModifiers?: GripModifierDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  power?: string[];
}

export class SoundEquipmentDto implements SoundEquipment {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  microphones?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  recorders?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  wireless?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  monitoring?: string[];
}

export class ArtPropsDto implements ArtProps {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  characterProps?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  setProps?: string[];
}

export class ArtEquipmentDto implements ArtEquipment {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  setConstruction?: string[];

  @ValidateNested()
  @Type(() => ArtPropsDto)
  @IsOptional()
  props?: ArtPropsDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  setDressing?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  costumes?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specialEffects?: string[];
}

export class EquipmentDto {
  @ValidateNested()
  @Type(() => DirectionEquipmentDto)
  @IsOptional()
  direction?: DirectionEquipmentDto;

  @ValidateNested()
  @Type(() => ProductionEquipmentDto)
  @IsOptional()
  production?: ProductionEquipmentDto;

  @ValidateNested()
  @Type(() => CinematographyEquipmentDto)
  @IsOptional()
  cinematography?: CinematographyEquipmentDto;

  @ValidateNested()
  @Type(() => LightingEquipmentDto)
  @IsOptional()
  lighting?: LightingEquipmentDto;

  @ValidateNested()
  @Type(() => SoundEquipmentDto)
  @IsOptional()
  sound?: SoundEquipmentDto;

  @ValidateNested()
  @Type(() => ArtEquipmentDto)
  @IsOptional()
  art?: ArtEquipmentDto;
}

export class CastMemberDto implements CastMember {
  @IsString()
  @IsNotEmpty()
  role: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsMongoId()
  @IsOptional()
  profileId?: string;
}

export class ExtraMemberDto implements ExtraMember {
  @IsString()
  @IsNotEmpty()
  role: string;

  @IsNumber()
  @IsNotEmpty()
  number: number;
}

export class CrewMemberDto implements CrewMember {
  @ApiProperty({
    description: '역할',
    example: '감독'
  })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiPropertyOptional({
    description: '연락처',
    example: '010-1234-5678'
  })
  @IsString()
  @IsOptional()
  contact?: string;

  @ApiPropertyOptional({
    description: '프로필 ID',
    example: '507f1f77bcf86cd799439011'
  })
  @IsMongoId()
  @IsOptional()
  profileId?: string;
}

export class CreateSceneRequestDto {
  @ApiProperty({ 
    description: '씬 제목',
    example: 'Scene 1 - 주인공 도시 도착',
    maxLength: 200
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ 
    description: '씬 설명',
    example: '주인공이 처음으로 도시에 도착하여 주변을 둘러보는 도입부 씬',
    maxLength: 1000
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;

  @ApiProperty({
    description: '씬 대사',
    example: [
      {
        character: '김철수',
        text: '여기가 바로 그곳이군... 정말 예쁘네.'
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DialogueDto)
  @IsNotEmpty()
  dialogues: DialogueDto[];

  @ApiProperty({
    description: '씬 날씨',
    example: '맑음'
  })
  @IsString()
  @IsNotEmpty()
  weather: string;

  @ApiProperty({
    description: '씬 조명',
    example: {
      description: '자연광과 인공광의 조화',
      setup: {
        keyLight: { type: 'HMI', equipment: 'Arri M18', intensity: '18K' },
        fillLight: { type: 'LED', equipment: 'Arri 1.2K', intensity: '1.2K' },
        backLight: { type: 'HMI', equipment: 'Arri M18', intensity: '18K' },
        backgroundLight: { type: 'LED', equipment: 'Arri 1.2K', intensity: '1.2K' },
        specialEffects: { type: 'LED', equipment: 'Arri 1.2K', intensity: '1.2K' },
        softLight: { type: 'LED', equipment: 'Arri 1.2K', intensity: '1.2K' },
        gripModifier: {
          flags: ['플래그1', '플래그2'],
          diffusion: ['디퓨전1', '디퓨전2'],
          reflectors: ['리플렉터1', '리플렉터2'],
          colorGels: ['젤1', '젤2']
        },
        overall: {
          colorTemperature: '5600K',
          mood: '따뜻한'
        }
      }
    }
  })
  @ValidateNested()
  @Type(() => LightingDto)
  @IsNotEmpty()
  lighting: LightingDto;

  @ApiProperty({
    description: '씬 시각 설명',
    example: '도시의 고층빌딩들이 하늘을 가리고, 거리에는 사람들이 바쁘게 오가는 모습'
  })
  @IsString()
  @IsNotEmpty()
  visualDescription: string;

  @ApiProperty({
    description: '씬 장소',
    example: '서울 강남구 테헤란로',
    maxLength: 200
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  scenePlace: string;

  @ApiProperty({
    description: '씬 시간',
    example: '2024년 1월 15일 오후 3시',
    maxLength: 200
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  sceneDateTime: string;

  @ApiProperty({
    description: 'VFX 필요 여부',
    example: false
  })
  @IsBoolean()
  @IsNotEmpty()
  vfxRequired: boolean;

  @ApiProperty({
    description: 'SFX 필요 여부',
    example: true
  })
  @IsBoolean()
  @IsNotEmpty()
  sfxRequired: boolean;

  @ApiProperty({
    description: '예상 지속 시간',
    example: '5분'
  })
  @IsString()
  @IsNotEmpty()
  estimatedDuration: string;

  @ApiProperty({
    description: '씬 위치',
    example: {
      name: '서울 강남구 테헤란로',
      address: '서울특별시 강남구 테헤란로 123',
      group_name: '강남구 촬영지'
    }
  })
  @ValidateNested()
  @Type(() => RealLocationDto)
  @IsNotEmpty()
  location: RealLocationDto;

  @ApiProperty({
    description: '씬 시간대',
    example: '오후'
  })
  @IsEnum(['새벽', '아침', '점심', '저녁', '밤'])
  @IsNotEmpty()
  timeOfDay: string;

  @ApiProperty({
    description: '인력 구성',
    example: {
      direction: {
        director: [
          { role: '감독', profileId: '507f1f77bcf86cd799439011' }
        ],
        assistantDirector: [
          { role: '부감독', profileId: '507f1f77bcf86cd799439012' }
        ],
        scriptSupervisor: [
          { role: '스크립트 감독', profileId: '507f1f77bcf86cd799439013' }
        ],
        continuity: [
          { role: '연속성 감독', profileId: '507f1f77bcf86cd799439014' }
        ]
      },
      production: {
        producer: [
          { role: '제작자', profileId: '507f1f77bcf86cd799439015' }
        ],
        lineProducer: [
          { role: '라인 제작자', profileId: '507f1f77bcf86cd799439016' }
        ],
        productionManager: [
          { role: '제작 관리자', profileId: '507f1f77bcf86cd799439017' }
        ],
        productionAssistant: [
          { role: '제작 어시스턴트', profileId: '507f1f77bcf86cd799439018' }
        ]
      },
      cinematography: {
        cinematographer: [
          { role: '촬영감독', profileId: '507f1f77bcf86cd799439019' }
        ],
        cameraOperator: [
          { role: '카메라 오퍼레이터', profileId: '507f1f77bcf86cd799439020' }
        ],
        firstAssistant: [
          { role: '퍼스트 어시스턴트', profileId: '507f1f77bcf86cd799439021' }
        ],
        secondAssistant: [
          { role: '세컨드 어시스턴트', profileId: '507f1f77bcf86cd799439022' }
        ],
        dollyGrip: [
          { role: '돌리 그립', profileId: '507f1f77bcf86cd799439023' }
        ]
      },
      lighting: {
        gaffer: [
          { role: '개퍼', profileId: '507f1f77bcf86cd799439024' }
        ],
        bestBoy: [
          { role: '베스트 보이', profileId: '507f1f77bcf86cd799439025' }
        ],
        electrician: [
          { role: '일렉트리션', profileId: '507f1f77bcf86cd799439026' }
        ],
        generatorOperator: [
          { role: '제너레이터 오퍼레이터', profileId: '507f1f77bcf86cd799439027' }
        ]
      },
      sound: {
        soundMixer: [
          { role: '사운드 믹서', profileId: '507f1f77bcf86cd799439028' }
        ],
        boomOperator: [
          { role: '붐 오퍼레이터', profileId: '507f1f77bcf86cd799439029' }
        ],
        soundAssistant: [
          { role: '사운드 어시스턴트', profileId: '507f1f77bcf86cd799439030' }
        ],
        utility: [
          { role: '유틸리티', profileId: '507f1f77bcf86cd799439031' }
        ]
      },
      art: {
        productionDesigner: [
          { role: '프로덕션 디자이너', profileId: '507f1f77bcf86cd799439032' }
        ],
        artDirector: [
          { role: '아트 디렉터', profileId: '507f1f77bcf86cd799439033' }
        ],
        setDecorator: [
          { role: '세트 데코레이터', profileId: '507f1f77bcf86cd799439034' }
        ],
        propMaster: [
          { role: '소품 마스터', profileId: '507f1f77bcf86cd799439035' }
        ],
        makeupArtist: [
          { role: '메이크업 아티스트', profileId: '507f1f77bcf86cd799439036' }
        ],
        costumeDesigner: [
          { role: '코스튬 디자이너', profileId: '507f1f77bcf86cd799439037' }
        ],
        hairStylist: [
          { role: '헤어 스타일리스트', profileId: '507f1f77bcf86cd799439038' }
        ]
      }
    }
  })
  @ValidateNested()
  @Type(() => CrewDto)
  @IsNotEmpty()
  crew: CrewDto;

  @ApiProperty({
    description: '장비 구성',
    example: {
      direction: {
        monitors: ['모니터1', '모니터2'],
        communication: ['통신장비1', '통신장비2'],
        scriptBoards: ['보드1', '보드2']
      },
      production: {
        scheduling: ['스케줄링1', '스케줄링2'],
        safety: ['안전장비1', '안전장비2'],
        transportation: ['운송장비1', '운송장비2']
      },
      cinematography: {
        cameras: ['Arri Alexa Mini', 'Sony FX6'],
        lenses: ['50mm f/1.8', '24-70mm f/2.8'],
        supports: ['Manfrotto 504HD', 'DJI RS 3 Pro'],
        filters: ['Tiffen Variable ND', 'Polarizing Filter'],
        accessories: ['Teradek Bolt 4K', 'SmallHD 7" Monitor']
      },
      lighting: {
        keyLights: ['Arri M18', 'Arri 1.2K'],
        fillLights: ['Arri 1.2K', 'LED 패널'],
        backLights: ['Arri M18', 'Arri 1.2K'],
        backgroundLights: ['Arri 1.2K', 'LED 패널'],
        specialEffectsLights: ['Arri 1.2K', 'LED 패널'],
        softLights: ['Softbox', 'Ring Light'],
        gripModifiers: {
          flags: ['플래그1', '플래그2'],
          diffusion: ['디퓨전1', '디퓨전2'],
          reflectors: ['리플렉터1', '리플렉터2'],
          colorGels: ['젤1', '젤2']
        },
        power: ['전원장비1', '전원장비2']
      },
      sound: {
        microphones: ['Sennheiser MKH416', 'Shure SM7B'],
        recorders: ['Zoom F8', 'Sound Devices 633'],
        wireless: ['무선마이크1', '무선마이크2'],
        monitoring: ['모니터링1', '모니터링2']
      },
      art: {
        setConstruction: ['제작1', '제작2'],
        props: {
          characterProps: ['소품1', '소품2'],
          setProps: ['세트소품1', '세트소품2']
        },
        setDressing: ['드레싱1', '드레싱2'],
        costumes: ['의상1', '의상2'],
        specialEffects: ['특수효과1', '특수효과2']
      }
    }
  })
  @ValidateNested()
  @Type(() => EquipmentDto)
  @IsNotEmpty()
  equipment: EquipmentDto;

  @ApiProperty({
    description: '출연진',
    example: [
      {
        role: '주인공',
        name: '김철수',
        profileId: '507f1f77bcf86cd799439011'
      },
      {
        role: '조연',
        name: '이영희',
        profileId: '507f1f77bcf86cd799439012'
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CastMemberDto)
  @IsNotEmpty()
  cast: CastMemberDto[];

  @ApiProperty({
    description: '추가 인원',
    example: [
      {
        role: '단역 1',
        number: 1
      },
      {
        role: '단역 2',
        number: 2
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtraMemberDto)
  @IsNotEmpty()
  extra: ExtraMemberDto[];

  @ApiProperty({
    description: '특별 요구사항',
    example: ['도시 배경음 필요', '자연스러운 연기']
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  specialRequirements: string[];

  @ApiProperty({
    description: '순서',
    example: 1
  })
  @IsNumber()
  @IsNotEmpty()
  order: number;
}

export class UpdateSceneRequestDto {
  @ApiPropertyOptional({ 
    description: '씬 제목',
    example: 'Scene 1 - 주인공 도시 도착 (수정)',
    maxLength: 200
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ 
    description: '씬 설명',
    example: '주인공이 처음으로 도시에 도착하여 주변을 둘러보는 도입부 씬 (수정됨)',
    maxLength: 1000
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ 
    description: '씬 대사',
    example: [
      {
        character: '김철수',
        text: '여기가 바로 그곳이군... 정말 예쁘네.'
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DialogueDto)
  @IsOptional()
  dialogues?: DialogueDto[];

  @ApiPropertyOptional({ 
    description: '씬 날씨',
    example: '맑음'
  })
  @IsString()
  @IsOptional()
  weather?: string;

  @ApiPropertyOptional({ 
    description: '씬 조명',
    example: {
      description: '자연광과 인공광의 조화',
      setup: {
        keyLight: { type: 'HMI', equipment: 'Arri M18', intensity: '18K' },
        fillLight: { type: 'LED', equipment: 'Arri 1.2K', intensity: '1.2K' },
        backLight: { type: 'HMI', equipment: 'Arri M18', intensity: '18K' },
        backgroundLight: { type: 'LED', equipment: 'Arri 1.2K', intensity: '1.2K' },
        specialEffects: { type: 'LED', equipment: 'Arri 1.2K', intensity: '1.2K' },
        softLight: { type: 'LED', equipment: 'Arri 1.2K', intensity: '1.2K' },
        gripModifier: {
          flags: ['플래그1', '플래그2'],
          diffusion: ['디퓨전1', '디퓨전2'],
          reflectors: ['리플렉터1', '리플렉터2'],
          colorGels: ['젤1', '젤2']
        },
        overall: {
          colorTemperature: '5600K',
          mood: '따뜻한'
        }
      }
    }
  })
  @ValidateNested()
  @Type(() => LightingDto)
  @IsOptional()
  lighting?: LightingDto;

  @ApiPropertyOptional({ 
    description: '씬 시각 설명',
    example: '도시의 고층빌딩들이 하늘을 가리고, 거리에는 사람들이 바쁘게 오가는 모습'
  })
  @IsString()
  @IsOptional()
  visualDescription?: string;

  @ApiPropertyOptional({ 
    description: '씬 장소',
    example: '서울 강남구 테헤란로'
  })
  @IsString()
  @IsOptional()
  scenePlace?: string;

  @ApiPropertyOptional({ 
    description: '씬 시간',
    example: '2024년 1월 15일 오후 3시'
  })
  @IsString()
  @IsOptional()
  sceneDateTime?: string;

  @ApiPropertyOptional({ 
    description: 'VFX 필요 여부',
    example: false
  })
  @IsBoolean()
  @IsOptional()
  vfxRequired?: boolean;

  @ApiPropertyOptional({ 
    description: 'SFX 필요 여부',
    example: true
  })
  @IsBoolean()
  @IsOptional()
  sfxRequired?: boolean;

  @ApiPropertyOptional({ 
    description: '예상 지속 시간',
    example: '5분'
  })
  @IsString()
  @IsOptional()
  estimatedDuration?: string;

  @ApiPropertyOptional({ 
    description: '씬 위치',
    example: {
      name: '서울 강남구 테헤란로',
      address: '서울특별시 강남구 테헤란로 123',
      group_name: '강남구 촬영지'
    }
  })
  @ValidateNested()
  @Type(() => RealLocationDto)
  @IsOptional()
  location?: RealLocationDto;

  @ApiPropertyOptional({ 
    description: '씬 시간대',
    example: '오후'
  })
  @IsEnum(['새벽', '아침', '오후', '저녁', '밤', '낮'])
  @IsOptional()
  timeOfDay?: string;

  @ApiPropertyOptional({ 
    description: '인력 구성',
    example: {
      direction: {
        director: [
          { role: '감독', profileId: '507f1f77bcf86cd799439011' }
        ],
        assistantDirector: [
          { role: '부감독', profileId: '507f1f77bcf86cd799439012' }
        ]
      }
    }
  })
  @ValidateNested()
  @Type(() => CrewDto)
  @IsOptional()
  crew?: CrewDto;

  @ApiPropertyOptional({ 
    description: '장비 구성',
    example: {
      cinematography: {
        cameras: ['Arri Alexa Mini'],
        lenses: ['50mm f/1.8']
      },
      lighting: {
        keyLights: ['Arri M18'],
        fillLights: ['Arri 1.2K']
      }
    }
  })
  @ValidateNested()
  @Type(() => EquipmentDto)
  @IsOptional()
  equipment?: EquipmentDto;

  @ApiPropertyOptional({ 
    description: '출연진',
    example: [
      {
        role: '주인공',
        name: '김철수',
        profileId: '507f1f77bcf86cd799439011'
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CastMemberDto)
  @IsOptional()
  cast?: CastMemberDto[];

  @ApiPropertyOptional({
    description: '추가 인원',
    example: [
      {
        role: '단역 1',
        number: 1
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtraMemberDto)
  @IsOptional()
  extra?: ExtraMemberDto[];

  @ApiPropertyOptional({ 
    description: '특별 요구사항',
    example: ['도시 배경음 필요', '자연스러운 연기']
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specialRequirements?: string[];

  @ApiPropertyOptional({ 
    description: '순서',
    example: 1
  })
  @IsNumber()
  @IsOptional()
  order?: number;
}

export class CreateSceneDraftRequestDto {
  @ApiProperty({ 
    description: '생성할 씬 개수',
    example: 5,
    minimum: 1,
    maximum: 20
  })
  @IsNumber()
  @Min(1)
  @Max(20)
  @IsNotEmpty()
  maxScenes: number;
}