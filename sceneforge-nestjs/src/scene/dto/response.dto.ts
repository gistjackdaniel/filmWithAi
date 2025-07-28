import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

// Sub-schemas
export class DialogueResponseDto {
  @ApiProperty({ description: '대화하는 캐릭터 이름', example: '김철수' })
  character: string;

  @ApiProperty({ description: '대화 내용', example: '여기가 바로 그곳이군... 정말 예쁘네.' })
  text: string;
}

export class LightSetupResponseDto {
  @ApiProperty({ description: '조명 타입', example: 'HMI' })
  type: string;

  @ApiProperty({ description: '조명 장비', example: 'Arri M18' })
  equipment: string;

  @ApiProperty({ description: '조명 강도', example: '18K' })
  intensity: string;
}

export class GripModifierResponseDto {
  @ApiProperty({ description: '플래그 목록', example: ['플래그1', '플래그2'] })
  flags: string[];

  @ApiProperty({ description: '디퓨전 목록', example: ['디퓨전1', '디퓨전2'] })
  diffusion: string[];

  @ApiProperty({ description: '리플렉터 목록', example: ['리플렉터1', '리플렉터2'] })
  reflectors: string[];

  @ApiProperty({ description: '컬러 젤 목록', example: ['젤1', '젤2'] })
  colorGels: string[];
}

export class LightOverallResponseDto {
  @ApiProperty({ description: '색온도', example: '5600K' })
  colorTemperature: string;

  @ApiProperty({ description: '분위기', example: '따뜻한' })
  mood: string;
}

export class LightingSetupResponseDto {
  @ApiProperty({ description: '키 라이트', type: LightSetupResponseDto })
  keyLight: LightSetupResponseDto;

  @ApiProperty({ description: '필 라이트', type: LightSetupResponseDto })
  fillLight: LightSetupResponseDto;

  @ApiProperty({ description: '백 라이트', type: LightSetupResponseDto })
  backLight: LightSetupResponseDto;

  @ApiProperty({ description: '배경 라이트', type: LightSetupResponseDto })
  backgroundLight: LightSetupResponseDto;

  @ApiProperty({ description: '특수 효과 라이트', type: LightSetupResponseDto })
  specialEffects: LightSetupResponseDto;

  @ApiProperty({ description: '소프트 라이트', type: LightSetupResponseDto })
  softLight: LightSetupResponseDto;

  @ApiProperty({ description: '그립 모디파이어', type: GripModifierResponseDto })
  gripModifier: GripModifierResponseDto;

  @ApiProperty({ description: '전체 조명 설정', type: LightOverallResponseDto })
  overall: LightOverallResponseDto;
}

export class LightingResponseDto {
  @ApiProperty({ description: '조명 설명', example: '자연광과 인공광의 조화' })
  description: string;

  @ApiProperty({ description: '조명 설정', type: LightingSetupResponseDto })
  setup: LightingSetupResponseDto;
}

export class RealLocationResponseDto {
  @ApiProperty({ description: '위치 이름', example: '서울 강남구 테헤란로' })
  name: string;

  @ApiProperty({ description: '실제 주소', example: '서울특별시 강남구 테헤란로 123' })
  address: string;

  @ApiProperty({ description: '위치 그룹명', example: '강남구 촬영지' })
  group_name: string;
}

export class CrewMemberResponseDto {
  @ApiProperty({ description: '인력 역할', example: '감독' })
  role: string;

  @ApiProperty({ description: '인력 ID', example: '507f1f77bcf86cd799439011' })
  profileId?: Types.ObjectId;
}

export class CrewRoleResponseDto {
  @ApiProperty({ description: '감독', type: [CrewMemberResponseDto] })
  director: CrewMemberResponseDto[];

  @ApiProperty({ description: '조감독', type: [CrewMemberResponseDto] })
  assistantDirector: CrewMemberResponseDto[];

  @ApiProperty({ description: '스크립트 슈퍼바이저', type: [CrewMemberResponseDto] })
  scriptSupervisor: CrewMemberResponseDto[];

  @ApiProperty({ description: '컨티뉴이티', type: [CrewMemberResponseDto] })
  continuity: CrewMemberResponseDto[];
}

export class ProductionResponseDto {
  @ApiProperty({ description: '프로듀서', type: [CrewMemberResponseDto] })
  producer: CrewMemberResponseDto[];

  @ApiProperty({ description: '라인 프로듀서', type: [CrewMemberResponseDto] })
  lineProducer: CrewMemberResponseDto[];

  @ApiProperty({ description: '프로덕션 매니저', type: [CrewMemberResponseDto] })
  productionManager: CrewMemberResponseDto[];

  @ApiProperty({ description: '프로덕션 어시스턴트', type: [CrewMemberResponseDto] })
  productionAssistant: CrewMemberResponseDto[];
}

export class CinematographyResponseDto {
  @ApiProperty({ description: '촬영감독', type: [CrewMemberResponseDto] })
  cinematographer: CrewMemberResponseDto[];

  @ApiProperty({ description: '카메라 오퍼레이터', type: [CrewMemberResponseDto] })
  cameraOperator: CrewMemberResponseDto[];

  @ApiProperty({ description: '퍼스트 어시스턴트', type: [CrewMemberResponseDto] })
  firstAssistant: CrewMemberResponseDto[];

  @ApiProperty({ description: '세컨드 어시스턴트', type: [CrewMemberResponseDto] })
  secondAssistant: CrewMemberResponseDto[];

  @ApiProperty({ description: '돌리 그립', type: [CrewMemberResponseDto] })
  dollyGrip: CrewMemberResponseDto[];
}

export class LightingCrewResponseDto {
  @ApiProperty({ description: '개퍼', type: [CrewMemberResponseDto] })
  gaffer: CrewMemberResponseDto[];

  @ApiProperty({ description: '베스트 보이', type: [CrewMemberResponseDto] })
  bestBoy: CrewMemberResponseDto[];

  @ApiProperty({ description: '일렉트리션', type: [CrewMemberResponseDto] })
  electrician: CrewMemberResponseDto[];

  @ApiProperty({ description: '제너레이터 오퍼레이터', type: [CrewMemberResponseDto] })
  generatorOperator: CrewMemberResponseDto[];
}

export class SoundResponseDto {
  @ApiProperty({ description: '사운드 믹서', type: [CrewMemberResponseDto] })
  soundMixer: CrewMemberResponseDto[];

  @ApiProperty({ description: '붐 오퍼레이터', type: [CrewMemberResponseDto] })
  boomOperator: CrewMemberResponseDto[];

  @ApiProperty({ description: '사운드 어시스턴트', type: [CrewMemberResponseDto] })
  soundAssistant: CrewMemberResponseDto[];

  @ApiProperty({ description: '유틸리티', type: [CrewMemberResponseDto] })
  utility: CrewMemberResponseDto[];
}

export class ArtResponseDto {
  @ApiProperty({ description: '프로덕션 디자이너', type: [CrewMemberResponseDto] })
  productionDesigner: CrewMemberResponseDto[];

  @ApiProperty({ description: '아트 디렉터', type: [CrewMemberResponseDto] })
  artDirector: CrewMemberResponseDto[];

  @ApiProperty({ description: '세트 데코레이터', type: [CrewMemberResponseDto] })
  setDecorator: CrewMemberResponseDto[];

  @ApiProperty({ description: '소품 마스터', type: [CrewMemberResponseDto] })
  propMaster: CrewMemberResponseDto[];

  @ApiProperty({ description: '메이크업 아티스트', type: [CrewMemberResponseDto] })
  makeupArtist: CrewMemberResponseDto[];

  @ApiProperty({ description: '코스튬 디자이너', type: [CrewMemberResponseDto] })
  costumeDesigner: CrewMemberResponseDto[];

  @ApiProperty({ description: '헤어 스타일리스트', type: [CrewMemberResponseDto] })
  hairStylist: CrewMemberResponseDto[];
}

export class CrewResponseDto {
  @ApiProperty({ description: '연출팀', type: CrewRoleResponseDto })
  direction: CrewRoleResponseDto;

  @ApiProperty({ description: '제작팀', type: ProductionResponseDto })
  production: ProductionResponseDto;

  @ApiProperty({ description: '촬영팀', type: CinematographyResponseDto })
  cinematography: CinematographyResponseDto;

  @ApiProperty({ description: '조명팀', type: LightingCrewResponseDto })
  lighting: LightingCrewResponseDto;

  @ApiProperty({ description: '음향팀', type: SoundResponseDto })
  sound: SoundResponseDto;

  @ApiProperty({ description: '미술팀', type: ArtResponseDto })
  art: ArtResponseDto;
}

export class DirectionEquipmentResponseDto {
  @ApiProperty({ description: '모니터', example: ['모니터1', '모니터2'] })
  monitors: string[];

  @ApiProperty({ description: '통신장비', example: ['통신장비1', '통신장비2'] })
  communication: string[];

  @ApiProperty({ description: '스크립트 보드', example: ['보드1', '보드2'] })
  scriptBoards: string[];
}

export class ProductionEquipmentResponseDto {
  @ApiProperty({ description: '스케줄링', example: ['스케줄링1', '스케줄링2'] })
  scheduling: string[];

  @ApiProperty({ description: '안전장비', example: ['안전장비1', '안전장비2'] })
  safety: string[];

  @ApiProperty({ description: '운송장비', example: ['운송장비1', '운송장비2'] })
  transportation: string[];
}

export class CinematographyEquipmentResponseDto {
  @ApiProperty({ description: '카메라', example: ['카메라1', '카메라2'] })
  cameras: string[];

  @ApiProperty({ description: '렌즈', example: ['렌즈1', '렌즈2'] })
  lenses: string[];

  @ApiProperty({ description: '지지대', example: ['지지대1', '지지대2'] })
  supports: string[];

  @ApiProperty({ description: '필터', example: ['필터1', '필터2'] })
  filters: string[];

  @ApiProperty({ description: '액세서리', example: ['액세서리1', '액세서리2'] })
  accessories: string[];
}

export class LightingEquipmentResponseDto {
  @ApiProperty({ description: '키 라이트', example: ['키라이트1', '키라이트2'] })
  keyLights: string[];

  @ApiProperty({ description: '필 라이트', example: ['필라이트1', '필라이트2'] })
  fillLights: string[];

  @ApiProperty({ description: '백 라이트', example: ['백라이트1', '백라이트2'] })
  backLights: string[];

  @ApiProperty({ description: '배경 라이트', example: ['배경라이트1', '배경라이트2'] })
  backgroundLights: string[];

  @ApiProperty({ description: '특수 효과 라이트', example: ['특수효과1', '특수효과2'] })
  specialEffectsLights: string[];

  @ApiProperty({ description: '소프트 라이트', example: ['소프트라이트1', '소프트라이트2'] })
  softLights: string[];

  @ApiProperty({ description: '그립 모디파이어', type: GripModifierResponseDto })
  gripModifiers: GripModifierResponseDto;

  @ApiProperty({ description: '전원장비', example: ['전원장비1', '전원장비2'] })
  power: string[];
}

export class SoundEquipmentResponseDto {
  @ApiProperty({ description: '마이크', example: ['마이크1', '마이크2'] })
  microphones: string[];

  @ApiProperty({ description: '레코더', example: ['레코더1', '레코더2'] })
  recorders: string[];

  @ApiProperty({ description: '무선장비', example: ['무선장비1', '무선장비2'] })
  wireless: string[];

  @ApiProperty({ description: '모니터링', example: ['모니터링1', '모니터링2'] })
  monitoring: string[];
}

export class ArtPropsResponseDto {
  @ApiProperty({ description: '캐릭터 소품', example: ['소품1', '소품2'] })
  characterProps: string[];

  @ApiProperty({ description: '세트 소품', example: ['세트소품1', '세트소품2'] })
  setProps: string[];
}

export class ArtEquipmentResponseDto {
  @ApiProperty({ description: '세트 제작', example: ['제작1', '제작2'] })
  setConstruction: string[];

  @ApiProperty({ description: '소품', type: ArtPropsResponseDto })
  props: ArtPropsResponseDto;

  @ApiProperty({ description: '세트 드레싱', example: ['드레싱1', '드레싱2'] })
  setDressing: string[];

  @ApiProperty({ description: '의상', example: ['의상1', '의상2'] })
  costumes: string[];

  @ApiProperty({ description: '특수 효과', example: ['특수효과1', '특수효과2'] })
  specialEffects: string[];
}

export class EquipmentResponseDto {
  @ApiProperty({ description: '연출 장비', type: DirectionEquipmentResponseDto })
  direction: DirectionEquipmentResponseDto;

  @ApiProperty({ description: '제작 장비', type: ProductionEquipmentResponseDto })
  production: ProductionEquipmentResponseDto;

  @ApiProperty({ description: '촬영 장비', type: CinematographyEquipmentResponseDto })
  cinematography: CinematographyEquipmentResponseDto;

  @ApiProperty({ description: '조명 장비', type: LightingEquipmentResponseDto })
  lighting: LightingEquipmentResponseDto;

  @ApiProperty({ description: '음향 장비', type: SoundEquipmentResponseDto })
  sound: SoundEquipmentResponseDto;

  @ApiProperty({ description: '미술 장비', type: ArtEquipmentResponseDto })
  art: ArtEquipmentResponseDto;
}

export class CastMemberResponseDto {
  @ApiProperty({ description: '역할', example: '주인공' })
  role: string;

  @ApiProperty({ description: '이름', example: '김철수' })
  name: string;

  @ApiProperty({ description: '프로필 ID', example: '507f1f77bcf86cd799439011' })
  profileId?: Types.ObjectId;
}

export class ExtraMemberResponseDto {
  @ApiProperty({ description: '역할', example: '주인공' })
  role: string;

  @ApiProperty({ description: '인원', example: 1 })
  number: number;
}

export class SceneResponseDto {
  @ApiProperty({ description: '씬 ID', example: '507f1f77bcf86cd799439011' })
  _id: Types.ObjectId;

  @ApiProperty({ description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' })
  projectId: Types.ObjectId;

  @ApiProperty({ description: '씬 제목', example: 'Scene 1 - 주인공 도시 도착' })
  title: string;

  @ApiProperty({ description: '씬 설명', example: '주인공이 처음으로 도시에 도착하여 주변을 둘러보는 도입부 씬' })
  description: string;

  @ApiProperty({ description: '대화 목록', type: [DialogueResponseDto] })
  dialogues: DialogueResponseDto[];

  @ApiProperty({ description: '날씨', example: '맑음' })
  weather: string;

  @ApiProperty({ description: '조명 설정', type: LightingResponseDto })
  lighting: LightingResponseDto;

  @ApiProperty({ description: '시각적 설명', example: '도시의 고층빌딩들이 하늘을 가리고, 거리에는 사람들이 바쁘게 오가는 모습' })
  visualDescription: string;

  @ApiProperty({ description: '씬 시간', example: '2024년 1월 15일 오후 3시' })
  sceneDateTime: string;

  @ApiProperty({ description: 'VFX 필요 여부', example: false })
  vfxRequired: boolean;

  @ApiProperty({ description: 'SFX 필요 여부', example: true })
  sfxRequired: boolean;

  @ApiProperty({ description: '예상 지속 시간', example: '5분' })
  estimatedDuration: string;

  @ApiProperty({ description: '씬 위치', example: '서울 강남구 테헤란로' })
  scenePlace: string;

  @ApiProperty({ description: '실제 위치', type: RealLocationResponseDto })
  location: RealLocationResponseDto;

  @ApiProperty({ description: '씬 시간대', example: '오후' })
  timeOfDay: string;

  @ApiProperty({ description: '인력 구성', type: CrewResponseDto })
  crew: CrewResponseDto;

  @ApiProperty({ description: '장비 구성', type: EquipmentResponseDto })
  equipment: EquipmentResponseDto;

  @ApiProperty({ description: '출연진', type: [CastMemberResponseDto] })
  cast: CastMemberResponseDto[];

  @ApiProperty({ description: '추가 인원', type: [ExtraMemberResponseDto] })
  extra: ExtraMemberResponseDto[];

  @ApiProperty({ description: '특별 요구사항', example: ['도시 배경음 필요', '자연스러운 연기'] })
  specialRequirements: string[];

  @ApiProperty({ description: '순서', example: 1 })
  order: number;

  @ApiProperty({ description: '삭제 여부', example: false })
  isDeleted: boolean;
}