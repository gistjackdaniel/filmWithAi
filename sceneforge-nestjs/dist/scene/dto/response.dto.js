"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneResponseDto = exports.ExtraMemberResponseDto = exports.CastMemberResponseDto = exports.EquipmentResponseDto = exports.ArtEquipmentResponseDto = exports.ArtPropsResponseDto = exports.SoundEquipmentResponseDto = exports.LightingEquipmentResponseDto = exports.CinematographyEquipmentResponseDto = exports.ProductionEquipmentResponseDto = exports.DirectionEquipmentResponseDto = exports.CrewResponseDto = exports.ArtResponseDto = exports.SoundResponseDto = exports.LightingCrewResponseDto = exports.CinematographyResponseDto = exports.ProductionResponseDto = exports.CrewRoleResponseDto = exports.CrewMemberResponseDto = exports.RealLocationResponseDto = exports.LightingResponseDto = exports.LightingSetupResponseDto = exports.LightOverallResponseDto = exports.GripModifierResponseDto = exports.LightSetupResponseDto = exports.DialogueResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const mongoose_1 = require("mongoose");
class DialogueResponseDto {
    character;
    text;
}
exports.DialogueResponseDto = DialogueResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '대화하는 캐릭터 이름', example: '김철수' }),
    __metadata("design:type", String)
], DialogueResponseDto.prototype, "character", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '대화 내용', example: '여기가 바로 그곳이군... 정말 예쁘네.' }),
    __metadata("design:type", String)
], DialogueResponseDto.prototype, "text", void 0);
class LightSetupResponseDto {
    type;
    equipment;
    intensity;
}
exports.LightSetupResponseDto = LightSetupResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '조명 타입', example: 'HMI' }),
    __metadata("design:type", String)
], LightSetupResponseDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '조명 장비', example: 'Arri M18' }),
    __metadata("design:type", String)
], LightSetupResponseDto.prototype, "equipment", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '조명 강도', example: '18K' }),
    __metadata("design:type", String)
], LightSetupResponseDto.prototype, "intensity", void 0);
class GripModifierResponseDto {
    flags;
    diffusion;
    reflectors;
    colorGels;
}
exports.GripModifierResponseDto = GripModifierResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '플래그 목록', example: ['플래그1', '플래그2'] }),
    __metadata("design:type", Array)
], GripModifierResponseDto.prototype, "flags", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '디퓨전 목록', example: ['디퓨전1', '디퓨전2'] }),
    __metadata("design:type", Array)
], GripModifierResponseDto.prototype, "diffusion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '리플렉터 목록', example: ['리플렉터1', '리플렉터2'] }),
    __metadata("design:type", Array)
], GripModifierResponseDto.prototype, "reflectors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '컬러 젤 목록', example: ['젤1', '젤2'] }),
    __metadata("design:type", Array)
], GripModifierResponseDto.prototype, "colorGels", void 0);
class LightOverallResponseDto {
    colorTemperature;
    mood;
}
exports.LightOverallResponseDto = LightOverallResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '색온도', example: '5600K' }),
    __metadata("design:type", String)
], LightOverallResponseDto.prototype, "colorTemperature", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '분위기', example: '따뜻한' }),
    __metadata("design:type", String)
], LightOverallResponseDto.prototype, "mood", void 0);
class LightingSetupResponseDto {
    keyLight;
    fillLight;
    backLight;
    backgroundLight;
    specialEffects;
    softLight;
    gripModifier;
    overall;
}
exports.LightingSetupResponseDto = LightingSetupResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '키 라이트', type: LightSetupResponseDto }),
    __metadata("design:type", LightSetupResponseDto)
], LightingSetupResponseDto.prototype, "keyLight", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '필 라이트', type: LightSetupResponseDto }),
    __metadata("design:type", LightSetupResponseDto)
], LightingSetupResponseDto.prototype, "fillLight", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '백 라이트', type: LightSetupResponseDto }),
    __metadata("design:type", LightSetupResponseDto)
], LightingSetupResponseDto.prototype, "backLight", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '배경 라이트', type: LightSetupResponseDto }),
    __metadata("design:type", LightSetupResponseDto)
], LightingSetupResponseDto.prototype, "backgroundLight", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '특수 효과 라이트', type: LightSetupResponseDto }),
    __metadata("design:type", LightSetupResponseDto)
], LightingSetupResponseDto.prototype, "specialEffects", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '소프트 라이트', type: LightSetupResponseDto }),
    __metadata("design:type", LightSetupResponseDto)
], LightingSetupResponseDto.prototype, "softLight", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '그립 모디파이어', type: GripModifierResponseDto }),
    __metadata("design:type", GripModifierResponseDto)
], LightingSetupResponseDto.prototype, "gripModifier", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '전체 조명 설정', type: LightOverallResponseDto }),
    __metadata("design:type", LightOverallResponseDto)
], LightingSetupResponseDto.prototype, "overall", void 0);
class LightingResponseDto {
    description;
    setup;
}
exports.LightingResponseDto = LightingResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '조명 설명', example: '자연광과 인공광의 조화' }),
    __metadata("design:type", String)
], LightingResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '조명 설정', type: LightingSetupResponseDto }),
    __metadata("design:type", LightingSetupResponseDto)
], LightingResponseDto.prototype, "setup", void 0);
class RealLocationResponseDto {
    name;
    address;
    group_name;
}
exports.RealLocationResponseDto = RealLocationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '위치 이름', example: '서울 강남구 테헤란로' }),
    __metadata("design:type", String)
], RealLocationResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '실제 주소', example: '서울특별시 강남구 테헤란로 123' }),
    __metadata("design:type", String)
], RealLocationResponseDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '위치 그룹명', example: '강남구 촬영지' }),
    __metadata("design:type", String)
], RealLocationResponseDto.prototype, "group_name", void 0);
class CrewMemberResponseDto {
    role;
    profileId;
}
exports.CrewMemberResponseDto = CrewMemberResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '인력 역할', example: '감독' }),
    __metadata("design:type", String)
], CrewMemberResponseDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '인력 ID', example: '507f1f77bcf86cd799439011' }),
    __metadata("design:type", mongoose_1.Types.ObjectId)
], CrewMemberResponseDto.prototype, "profileId", void 0);
class CrewRoleResponseDto {
    director;
    assistantDirector;
    scriptSupervisor;
    continuity;
}
exports.CrewRoleResponseDto = CrewRoleResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '감독', type: [CrewMemberResponseDto] }),
    __metadata("design:type", Array)
], CrewRoleResponseDto.prototype, "director", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '조감독', type: [CrewMemberResponseDto] }),
    __metadata("design:type", Array)
], CrewRoleResponseDto.prototype, "assistantDirector", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '스크립트 슈퍼바이저', type: [CrewMemberResponseDto] }),
    __metadata("design:type", Array)
], CrewRoleResponseDto.prototype, "scriptSupervisor", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '컨티뉴이티', type: [CrewMemberResponseDto] }),
    __metadata("design:type", Array)
], CrewRoleResponseDto.prototype, "continuity", void 0);
class ProductionResponseDto {
    producer;
    lineProducer;
    productionManager;
    productionAssistant;
}
exports.ProductionResponseDto = ProductionResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '프로듀서', type: [CrewMemberResponseDto] }),
    __metadata("design:type", Array)
], ProductionResponseDto.prototype, "producer", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '라인 프로듀서', type: [CrewMemberResponseDto] }),
    __metadata("design:type", Array)
], ProductionResponseDto.prototype, "lineProducer", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '프로덕션 매니저', type: [CrewMemberResponseDto] }),
    __metadata("design:type", Array)
], ProductionResponseDto.prototype, "productionManager", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '프로덕션 어시스턴트', type: [CrewMemberResponseDto] }),
    __metadata("design:type", Array)
], ProductionResponseDto.prototype, "productionAssistant", void 0);
class CinematographyResponseDto {
    cinematographer;
    cameraOperator;
    firstAssistant;
    secondAssistant;
    dollyGrip;
}
exports.CinematographyResponseDto = CinematographyResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '촬영감독', type: [CrewMemberResponseDto] }),
    __metadata("design:type", Array)
], CinematographyResponseDto.prototype, "cinematographer", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '카메라 오퍼레이터', type: [CrewMemberResponseDto] }),
    __metadata("design:type", Array)
], CinematographyResponseDto.prototype, "cameraOperator", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '퍼스트 어시스턴트', type: [CrewMemberResponseDto] }),
    __metadata("design:type", Array)
], CinematographyResponseDto.prototype, "firstAssistant", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '세컨드 어시스턴트', type: [CrewMemberResponseDto] }),
    __metadata("design:type", Array)
], CinematographyResponseDto.prototype, "secondAssistant", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '돌리 그립', type: [CrewMemberResponseDto] }),
    __metadata("design:type", Array)
], CinematographyResponseDto.prototype, "dollyGrip", void 0);
class LightingCrewResponseDto {
    gaffer;
    bestBoy;
    electrician;
    generatorOperator;
}
exports.LightingCrewResponseDto = LightingCrewResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '개퍼', type: [CrewMemberResponseDto] }),
    __metadata("design:type", Array)
], LightingCrewResponseDto.prototype, "gaffer", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '베스트 보이', type: [CrewMemberResponseDto] }),
    __metadata("design:type", Array)
], LightingCrewResponseDto.prototype, "bestBoy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '일렉트리션', type: [CrewMemberResponseDto] }),
    __metadata("design:type", Array)
], LightingCrewResponseDto.prototype, "electrician", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '제너레이터 오퍼레이터', type: [CrewMemberResponseDto] }),
    __metadata("design:type", Array)
], LightingCrewResponseDto.prototype, "generatorOperator", void 0);
class SoundResponseDto {
    soundMixer;
    boomOperator;
    soundAssistant;
    utility;
}
exports.SoundResponseDto = SoundResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '사운드 믹서', type: [CrewMemberResponseDto] }),
    __metadata("design:type", Array)
], SoundResponseDto.prototype, "soundMixer", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '붐 오퍼레이터', type: [CrewMemberResponseDto] }),
    __metadata("design:type", Array)
], SoundResponseDto.prototype, "boomOperator", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '사운드 어시스턴트', type: [CrewMemberResponseDto] }),
    __metadata("design:type", Array)
], SoundResponseDto.prototype, "soundAssistant", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '유틸리티', type: [CrewMemberResponseDto] }),
    __metadata("design:type", Array)
], SoundResponseDto.prototype, "utility", void 0);
class ArtResponseDto {
    productionDesigner;
    artDirector;
    setDecorator;
    propMaster;
    makeupArtist;
    costumeDesigner;
    hairStylist;
}
exports.ArtResponseDto = ArtResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '프로덕션 디자이너', type: [CrewMemberResponseDto] }),
    __metadata("design:type", Array)
], ArtResponseDto.prototype, "productionDesigner", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '아트 디렉터', type: [CrewMemberResponseDto] }),
    __metadata("design:type", Array)
], ArtResponseDto.prototype, "artDirector", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '세트 데코레이터', type: [CrewMemberResponseDto] }),
    __metadata("design:type", Array)
], ArtResponseDto.prototype, "setDecorator", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '소품 마스터', type: [CrewMemberResponseDto] }),
    __metadata("design:type", Array)
], ArtResponseDto.prototype, "propMaster", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '메이크업 아티스트', type: [CrewMemberResponseDto] }),
    __metadata("design:type", Array)
], ArtResponseDto.prototype, "makeupArtist", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '코스튬 디자이너', type: [CrewMemberResponseDto] }),
    __metadata("design:type", Array)
], ArtResponseDto.prototype, "costumeDesigner", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '헤어 스타일리스트', type: [CrewMemberResponseDto] }),
    __metadata("design:type", Array)
], ArtResponseDto.prototype, "hairStylist", void 0);
class CrewResponseDto {
    direction;
    production;
    cinematography;
    lighting;
    sound;
    art;
}
exports.CrewResponseDto = CrewResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '연출팀', type: CrewRoleResponseDto }),
    __metadata("design:type", CrewRoleResponseDto)
], CrewResponseDto.prototype, "direction", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '제작팀', type: ProductionResponseDto }),
    __metadata("design:type", ProductionResponseDto)
], CrewResponseDto.prototype, "production", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '촬영팀', type: CinematographyResponseDto }),
    __metadata("design:type", CinematographyResponseDto)
], CrewResponseDto.prototype, "cinematography", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '조명팀', type: LightingCrewResponseDto }),
    __metadata("design:type", LightingCrewResponseDto)
], CrewResponseDto.prototype, "lighting", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '음향팀', type: SoundResponseDto }),
    __metadata("design:type", SoundResponseDto)
], CrewResponseDto.prototype, "sound", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '미술팀', type: ArtResponseDto }),
    __metadata("design:type", ArtResponseDto)
], CrewResponseDto.prototype, "art", void 0);
class DirectionEquipmentResponseDto {
    monitors;
    communication;
    scriptBoards;
}
exports.DirectionEquipmentResponseDto = DirectionEquipmentResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '모니터', example: ['모니터1', '모니터2'] }),
    __metadata("design:type", Array)
], DirectionEquipmentResponseDto.prototype, "monitors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '통신장비', example: ['통신장비1', '통신장비2'] }),
    __metadata("design:type", Array)
], DirectionEquipmentResponseDto.prototype, "communication", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '스크립트 보드', example: ['보드1', '보드2'] }),
    __metadata("design:type", Array)
], DirectionEquipmentResponseDto.prototype, "scriptBoards", void 0);
class ProductionEquipmentResponseDto {
    scheduling;
    safety;
    transportation;
}
exports.ProductionEquipmentResponseDto = ProductionEquipmentResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '스케줄링', example: ['스케줄링1', '스케줄링2'] }),
    __metadata("design:type", Array)
], ProductionEquipmentResponseDto.prototype, "scheduling", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '안전장비', example: ['안전장비1', '안전장비2'] }),
    __metadata("design:type", Array)
], ProductionEquipmentResponseDto.prototype, "safety", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '운송장비', example: ['운송장비1', '운송장비2'] }),
    __metadata("design:type", Array)
], ProductionEquipmentResponseDto.prototype, "transportation", void 0);
class CinematographyEquipmentResponseDto {
    cameras;
    lenses;
    supports;
    filters;
    accessories;
}
exports.CinematographyEquipmentResponseDto = CinematographyEquipmentResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '카메라', example: ['카메라1', '카메라2'] }),
    __metadata("design:type", Array)
], CinematographyEquipmentResponseDto.prototype, "cameras", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '렌즈', example: ['렌즈1', '렌즈2'] }),
    __metadata("design:type", Array)
], CinematographyEquipmentResponseDto.prototype, "lenses", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '지지대', example: ['지지대1', '지지대2'] }),
    __metadata("design:type", Array)
], CinematographyEquipmentResponseDto.prototype, "supports", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '필터', example: ['필터1', '필터2'] }),
    __metadata("design:type", Array)
], CinematographyEquipmentResponseDto.prototype, "filters", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '액세서리', example: ['액세서리1', '액세서리2'] }),
    __metadata("design:type", Array)
], CinematographyEquipmentResponseDto.prototype, "accessories", void 0);
class LightingEquipmentResponseDto {
    keyLights;
    fillLights;
    backLights;
    backgroundLights;
    specialEffectsLights;
    softLights;
    gripModifiers;
    power;
}
exports.LightingEquipmentResponseDto = LightingEquipmentResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '키 라이트', example: ['키라이트1', '키라이트2'] }),
    __metadata("design:type", Array)
], LightingEquipmentResponseDto.prototype, "keyLights", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '필 라이트', example: ['필라이트1', '필라이트2'] }),
    __metadata("design:type", Array)
], LightingEquipmentResponseDto.prototype, "fillLights", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '백 라이트', example: ['백라이트1', '백라이트2'] }),
    __metadata("design:type", Array)
], LightingEquipmentResponseDto.prototype, "backLights", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '배경 라이트', example: ['배경라이트1', '배경라이트2'] }),
    __metadata("design:type", Array)
], LightingEquipmentResponseDto.prototype, "backgroundLights", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '특수 효과 라이트', example: ['특수효과1', '특수효과2'] }),
    __metadata("design:type", Array)
], LightingEquipmentResponseDto.prototype, "specialEffectsLights", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '소프트 라이트', example: ['소프트라이트1', '소프트라이트2'] }),
    __metadata("design:type", Array)
], LightingEquipmentResponseDto.prototype, "softLights", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '그립 모디파이어', type: GripModifierResponseDto }),
    __metadata("design:type", GripModifierResponseDto)
], LightingEquipmentResponseDto.prototype, "gripModifiers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '전원장비', example: ['전원장비1', '전원장비2'] }),
    __metadata("design:type", Array)
], LightingEquipmentResponseDto.prototype, "power", void 0);
class SoundEquipmentResponseDto {
    microphones;
    recorders;
    wireless;
    monitoring;
}
exports.SoundEquipmentResponseDto = SoundEquipmentResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '마이크', example: ['마이크1', '마이크2'] }),
    __metadata("design:type", Array)
], SoundEquipmentResponseDto.prototype, "microphones", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '레코더', example: ['레코더1', '레코더2'] }),
    __metadata("design:type", Array)
], SoundEquipmentResponseDto.prototype, "recorders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '무선장비', example: ['무선장비1', '무선장비2'] }),
    __metadata("design:type", Array)
], SoundEquipmentResponseDto.prototype, "wireless", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '모니터링', example: ['모니터링1', '모니터링2'] }),
    __metadata("design:type", Array)
], SoundEquipmentResponseDto.prototype, "monitoring", void 0);
class ArtPropsResponseDto {
    characterProps;
    setProps;
}
exports.ArtPropsResponseDto = ArtPropsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '캐릭터 소품', example: ['소품1', '소품2'] }),
    __metadata("design:type", Array)
], ArtPropsResponseDto.prototype, "characterProps", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '세트 소품', example: ['세트소품1', '세트소품2'] }),
    __metadata("design:type", Array)
], ArtPropsResponseDto.prototype, "setProps", void 0);
class ArtEquipmentResponseDto {
    setConstruction;
    props;
    setDressing;
    costumes;
    specialEffects;
}
exports.ArtEquipmentResponseDto = ArtEquipmentResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '세트 제작', example: ['제작1', '제작2'] }),
    __metadata("design:type", Array)
], ArtEquipmentResponseDto.prototype, "setConstruction", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '소품', type: ArtPropsResponseDto }),
    __metadata("design:type", ArtPropsResponseDto)
], ArtEquipmentResponseDto.prototype, "props", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '세트 드레싱', example: ['드레싱1', '드레싱2'] }),
    __metadata("design:type", Array)
], ArtEquipmentResponseDto.prototype, "setDressing", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '의상', example: ['의상1', '의상2'] }),
    __metadata("design:type", Array)
], ArtEquipmentResponseDto.prototype, "costumes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '특수 효과', example: ['특수효과1', '특수효과2'] }),
    __metadata("design:type", Array)
], ArtEquipmentResponseDto.prototype, "specialEffects", void 0);
class EquipmentResponseDto {
    direction;
    production;
    cinematography;
    lighting;
    sound;
    art;
}
exports.EquipmentResponseDto = EquipmentResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '연출 장비', type: DirectionEquipmentResponseDto }),
    __metadata("design:type", DirectionEquipmentResponseDto)
], EquipmentResponseDto.prototype, "direction", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '제작 장비', type: ProductionEquipmentResponseDto }),
    __metadata("design:type", ProductionEquipmentResponseDto)
], EquipmentResponseDto.prototype, "production", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '촬영 장비', type: CinematographyEquipmentResponseDto }),
    __metadata("design:type", CinematographyEquipmentResponseDto)
], EquipmentResponseDto.prototype, "cinematography", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '조명 장비', type: LightingEquipmentResponseDto }),
    __metadata("design:type", LightingEquipmentResponseDto)
], EquipmentResponseDto.prototype, "lighting", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '음향 장비', type: SoundEquipmentResponseDto }),
    __metadata("design:type", SoundEquipmentResponseDto)
], EquipmentResponseDto.prototype, "sound", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '미술 장비', type: ArtEquipmentResponseDto }),
    __metadata("design:type", ArtEquipmentResponseDto)
], EquipmentResponseDto.prototype, "art", void 0);
class CastMemberResponseDto {
    role;
    name;
    profileId;
}
exports.CastMemberResponseDto = CastMemberResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '역할', example: '주인공' }),
    __metadata("design:type", String)
], CastMemberResponseDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '이름', example: '김철수' }),
    __metadata("design:type", String)
], CastMemberResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '프로필 ID', example: '507f1f77bcf86cd799439011' }),
    __metadata("design:type", mongoose_1.Types.ObjectId)
], CastMemberResponseDto.prototype, "profileId", void 0);
class ExtraMemberResponseDto {
    role;
    number;
}
exports.ExtraMemberResponseDto = ExtraMemberResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '역할', example: '주인공' }),
    __metadata("design:type", String)
], ExtraMemberResponseDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '인원', example: 1 }),
    __metadata("design:type", Number)
], ExtraMemberResponseDto.prototype, "number", void 0);
class SceneResponseDto {
    _id;
    projectId;
    title;
    description;
    dialogues;
    weather;
    lighting;
    visualDescription;
    sceneDateTime;
    vfxRequired;
    sfxRequired;
    estimatedDuration;
    scenePlace;
    location;
    timeOfDay;
    crew;
    equipment;
    cast;
    extra;
    specialRequirements;
    order;
    isDeleted;
}
exports.SceneResponseDto = SceneResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '씬 ID', example: '507f1f77bcf86cd799439011' }),
    __metadata("design:type", mongoose_1.Types.ObjectId)
], SceneResponseDto.prototype, "_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' }),
    __metadata("design:type", mongoose_1.Types.ObjectId)
], SceneResponseDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '씬 제목', example: 'Scene 1 - 주인공 도시 도착' }),
    __metadata("design:type", String)
], SceneResponseDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '씬 설명', example: '주인공이 처음으로 도시에 도착하여 주변을 둘러보는 도입부 씬' }),
    __metadata("design:type", String)
], SceneResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '대화 목록', type: [DialogueResponseDto] }),
    __metadata("design:type", Array)
], SceneResponseDto.prototype, "dialogues", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '날씨', example: '맑음' }),
    __metadata("design:type", String)
], SceneResponseDto.prototype, "weather", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '조명 설정', type: LightingResponseDto }),
    __metadata("design:type", LightingResponseDto)
], SceneResponseDto.prototype, "lighting", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '시각적 설명', example: '도시의 고층빌딩들이 하늘을 가리고, 거리에는 사람들이 바쁘게 오가는 모습' }),
    __metadata("design:type", String)
], SceneResponseDto.prototype, "visualDescription", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '씬 시간', example: '2024년 1월 15일 오후 3시' }),
    __metadata("design:type", String)
], SceneResponseDto.prototype, "sceneDateTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'VFX 필요 여부', example: false }),
    __metadata("design:type", Boolean)
], SceneResponseDto.prototype, "vfxRequired", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'SFX 필요 여부', example: true }),
    __metadata("design:type", Boolean)
], SceneResponseDto.prototype, "sfxRequired", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '예상 지속 시간', example: '5분' }),
    __metadata("design:type", String)
], SceneResponseDto.prototype, "estimatedDuration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '씬 위치', example: '서울 강남구 테헤란로' }),
    __metadata("design:type", String)
], SceneResponseDto.prototype, "scenePlace", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '실제 위치', type: RealLocationResponseDto }),
    __metadata("design:type", RealLocationResponseDto)
], SceneResponseDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '씬 시간대', example: '오후' }),
    __metadata("design:type", String)
], SceneResponseDto.prototype, "timeOfDay", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '인력 구성', type: CrewResponseDto }),
    __metadata("design:type", CrewResponseDto)
], SceneResponseDto.prototype, "crew", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '장비 구성', type: EquipmentResponseDto }),
    __metadata("design:type", EquipmentResponseDto)
], SceneResponseDto.prototype, "equipment", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '출연진', type: [CastMemberResponseDto] }),
    __metadata("design:type", Array)
], SceneResponseDto.prototype, "cast", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '추가 인원', type: [ExtraMemberResponseDto] }),
    __metadata("design:type", Array)
], SceneResponseDto.prototype, "extra", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '특별 요구사항', example: ['도시 배경음 필요', '자연스러운 연기'] }),
    __metadata("design:type", Array)
], SceneResponseDto.prototype, "specialRequirements", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '순서', example: 1 }),
    __metadata("design:type", Number)
], SceneResponseDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '삭제 여부', example: false }),
    __metadata("design:type", Boolean)
], SceneResponseDto.prototype, "isDeleted", void 0);
//# sourceMappingURL=response.dto.js.map