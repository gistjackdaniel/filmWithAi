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
exports.CreateSceneDraftRequestDto = exports.UpdateSceneRequestDto = exports.CreateSceneRequestDto = exports.ExtraMemberDto = exports.CastMemberDto = exports.EquipmentDto = exports.ArtEquipmentDto = exports.ArtPropsDto = exports.SoundEquipmentDto = exports.LightingEquipmentDto = exports.CinematographyEquipmentDto = exports.ProductionEquipmentDto = exports.DirectionEquipmentDto = exports.CrewDto = exports.ArtDto = exports.SoundDto = exports.LightingCrewDto = exports.CinematographyDto = exports.ProductionDto = exports.CrewRoleDto = exports.RealLocationDto = exports.LightingDto = exports.LightingSetupDto = exports.LightOverallDto = exports.GripModifierDto = exports.LightSetupDto = exports.DialogueDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class DialogueDto {
    character;
    text;
}
exports.DialogueDto = DialogueDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '대화하는 캐릭터 이름',
        example: '김철수',
        maxLength: 100
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], DialogueDto.prototype, "character", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '대화 내용',
        example: '여기가 바로 그곳이군... 정말 예쁘네.',
        maxLength: 1000
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], DialogueDto.prototype, "text", void 0);
class LightSetupDto {
    type;
    equipment;
    intensity;
}
exports.LightSetupDto = LightSetupDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '조명 타입',
        example: 'HMI',
        maxLength: 100
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], LightSetupDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '조명 장비',
        example: 'Arri M18',
        maxLength: 100
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], LightSetupDto.prototype, "equipment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '조명 강도',
        example: '18K',
        maxLength: 100
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], LightSetupDto.prototype, "intensity", void 0);
class GripModifierDto {
    flags;
    diffusion;
    reflectors;
    colorGels;
}
exports.GripModifierDto = GripModifierDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], GripModifierDto.prototype, "flags", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], GripModifierDto.prototype, "diffusion", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], GripModifierDto.prototype, "reflectors", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], GripModifierDto.prototype, "colorGels", void 0);
class LightOverallDto {
    colorTemperature;
    mood;
}
exports.LightOverallDto = LightOverallDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], LightOverallDto.prototype, "colorTemperature", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], LightOverallDto.prototype, "mood", void 0);
class LightingSetupDto {
    keyLight;
    fillLight;
    backLight;
    backgroundLight;
    specialEffects;
    softLight;
    gripModifier;
    overall;
}
exports.LightingSetupDto = LightingSetupDto;
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => LightSetupDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", LightSetupDto)
], LightingSetupDto.prototype, "keyLight", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => LightSetupDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", LightSetupDto)
], LightingSetupDto.prototype, "fillLight", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => LightSetupDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", LightSetupDto)
], LightingSetupDto.prototype, "backLight", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => LightSetupDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", LightSetupDto)
], LightingSetupDto.prototype, "backgroundLight", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => LightSetupDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", LightSetupDto)
], LightingSetupDto.prototype, "specialEffects", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => LightSetupDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", LightSetupDto)
], LightingSetupDto.prototype, "softLight", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => GripModifierDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", GripModifierDto)
], LightingSetupDto.prototype, "gripModifier", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => LightOverallDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", LightOverallDto)
], LightingSetupDto.prototype, "overall", void 0);
class LightingDto {
    description;
    setup;
}
exports.LightingDto = LightingDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], LightingDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => LightingSetupDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", LightingSetupDto)
], LightingDto.prototype, "setup", void 0);
class RealLocationDto {
    name;
    address;
    group_name;
}
exports.RealLocationDto = RealLocationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '위치 이름',
        example: '서울 강남구 테헤란로'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RealLocationDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '실제 주소',
        example: '서울특별시 강남구 테헤란로 123'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RealLocationDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '위치 그룹명',
        example: '강남구 촬영지'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RealLocationDto.prototype, "group_name", void 0);
class CrewRoleDto {
    director;
    assistantDirector;
    scriptSupervisor;
    continuity;
}
exports.CrewRoleDto = CrewRoleDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CrewRoleDto.prototype, "director", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CrewRoleDto.prototype, "assistantDirector", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CrewRoleDto.prototype, "scriptSupervisor", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CrewRoleDto.prototype, "continuity", void 0);
class ProductionDto {
    producer;
    lineProducer;
    productionManager;
    productionAssistant;
}
exports.ProductionDto = ProductionDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ProductionDto.prototype, "producer", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ProductionDto.prototype, "lineProducer", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ProductionDto.prototype, "productionManager", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ProductionDto.prototype, "productionAssistant", void 0);
class CinematographyDto {
    cinematographer;
    cameraOperator;
    firstAssistant;
    secondAssistant;
    dollyGrip;
}
exports.CinematographyDto = CinematographyDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CinematographyDto.prototype, "cinematographer", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CinematographyDto.prototype, "cameraOperator", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CinematographyDto.prototype, "firstAssistant", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CinematographyDto.prototype, "secondAssistant", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CinematographyDto.prototype, "dollyGrip", void 0);
class LightingCrewDto {
    gaffer;
    bestBoy;
    electrician;
    generatorOperator;
}
exports.LightingCrewDto = LightingCrewDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], LightingCrewDto.prototype, "gaffer", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], LightingCrewDto.prototype, "bestBoy", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], LightingCrewDto.prototype, "electrician", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], LightingCrewDto.prototype, "generatorOperator", void 0);
class SoundDto {
    soundMixer;
    boomOperator;
    soundAssistant;
    utility;
}
exports.SoundDto = SoundDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], SoundDto.prototype, "soundMixer", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], SoundDto.prototype, "boomOperator", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], SoundDto.prototype, "soundAssistant", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], SoundDto.prototype, "utility", void 0);
class ArtDto {
    productionDesigner;
    artDirector;
    setDecorator;
    propMaster;
    makeupArtist;
    costumeDesigner;
    hairStylist;
}
exports.ArtDto = ArtDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ArtDto.prototype, "productionDesigner", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ArtDto.prototype, "artDirector", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ArtDto.prototype, "setDecorator", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ArtDto.prototype, "propMaster", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ArtDto.prototype, "makeupArtist", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ArtDto.prototype, "costumeDesigner", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ArtDto.prototype, "hairStylist", void 0);
class CrewDto {
    direction;
    production;
    cinematography;
    lighting;
    sound;
    art;
}
exports.CrewDto = CrewDto;
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CrewRoleDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", CrewRoleDto)
], CrewDto.prototype, "direction", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ProductionDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", ProductionDto)
], CrewDto.prototype, "production", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CinematographyDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", CinematographyDto)
], CrewDto.prototype, "cinematography", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => LightingCrewDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", LightingCrewDto)
], CrewDto.prototype, "lighting", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => SoundDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", SoundDto)
], CrewDto.prototype, "sound", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ArtDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", ArtDto)
], CrewDto.prototype, "art", void 0);
class DirectionEquipmentDto {
    monitors;
    communication;
    scriptBoards;
}
exports.DirectionEquipmentDto = DirectionEquipmentDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], DirectionEquipmentDto.prototype, "monitors", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], DirectionEquipmentDto.prototype, "communication", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], DirectionEquipmentDto.prototype, "scriptBoards", void 0);
class ProductionEquipmentDto {
    scheduling;
    safety;
    transportation;
}
exports.ProductionEquipmentDto = ProductionEquipmentDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ProductionEquipmentDto.prototype, "scheduling", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ProductionEquipmentDto.prototype, "safety", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ProductionEquipmentDto.prototype, "transportation", void 0);
class CinematographyEquipmentDto {
    cameras;
    lenses;
    supports;
    filters;
    accessories;
}
exports.CinematographyEquipmentDto = CinematographyEquipmentDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CinematographyEquipmentDto.prototype, "cameras", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CinematographyEquipmentDto.prototype, "lenses", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CinematographyEquipmentDto.prototype, "supports", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CinematographyEquipmentDto.prototype, "filters", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CinematographyEquipmentDto.prototype, "accessories", void 0);
class LightingEquipmentDto {
    keyLights;
    fillLights;
    backLights;
    backgroundLights;
    specialEffectsLights;
    softLights;
    gripModifiers;
    power;
}
exports.LightingEquipmentDto = LightingEquipmentDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], LightingEquipmentDto.prototype, "keyLights", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], LightingEquipmentDto.prototype, "fillLights", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], LightingEquipmentDto.prototype, "backLights", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], LightingEquipmentDto.prototype, "backgroundLights", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], LightingEquipmentDto.prototype, "specialEffectsLights", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], LightingEquipmentDto.prototype, "softLights", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => GripModifierDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", GripModifierDto)
], LightingEquipmentDto.prototype, "gripModifiers", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], LightingEquipmentDto.prototype, "power", void 0);
class SoundEquipmentDto {
    microphones;
    recorders;
    wireless;
    monitoring;
}
exports.SoundEquipmentDto = SoundEquipmentDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], SoundEquipmentDto.prototype, "microphones", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], SoundEquipmentDto.prototype, "recorders", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], SoundEquipmentDto.prototype, "wireless", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], SoundEquipmentDto.prototype, "monitoring", void 0);
class ArtPropsDto {
    characterProps;
    setProps;
}
exports.ArtPropsDto = ArtPropsDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ArtPropsDto.prototype, "characterProps", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ArtPropsDto.prototype, "setProps", void 0);
class ArtEquipmentDto {
    setConstruction;
    props;
    setDressing;
    costumes;
    specialEffects;
}
exports.ArtEquipmentDto = ArtEquipmentDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ArtEquipmentDto.prototype, "setConstruction", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ArtPropsDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", ArtPropsDto)
], ArtEquipmentDto.prototype, "props", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ArtEquipmentDto.prototype, "setDressing", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ArtEquipmentDto.prototype, "costumes", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ArtEquipmentDto.prototype, "specialEffects", void 0);
class EquipmentDto {
    direction;
    production;
    cinematography;
    lighting;
    sound;
    art;
}
exports.EquipmentDto = EquipmentDto;
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DirectionEquipmentDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", DirectionEquipmentDto)
], EquipmentDto.prototype, "direction", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ProductionEquipmentDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", ProductionEquipmentDto)
], EquipmentDto.prototype, "production", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CinematographyEquipmentDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", CinematographyEquipmentDto)
], EquipmentDto.prototype, "cinematography", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => LightingEquipmentDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", LightingEquipmentDto)
], EquipmentDto.prototype, "lighting", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => SoundEquipmentDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", SoundEquipmentDto)
], EquipmentDto.prototype, "sound", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ArtEquipmentDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", ArtEquipmentDto)
], EquipmentDto.prototype, "art", void 0);
class CastMemberDto {
    role;
    name;
    profileId;
}
exports.CastMemberDto = CastMemberDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CastMemberDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CastMemberDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CastMemberDto.prototype, "profileId", void 0);
class ExtraMemberDto {
    role;
    number;
}
exports.ExtraMemberDto = ExtraMemberDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ExtraMemberDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], ExtraMemberDto.prototype, "number", void 0);
class CreateSceneRequestDto {
    title;
    description;
    dialogues;
    weather;
    lighting;
    visualDescription;
    scenePlace;
    sceneDateTime;
    vfxRequired;
    sfxRequired;
    estimatedDuration;
    location;
    timeOfDay;
    crew;
    equipment;
    cast;
    extra;
    specialRequirements;
    order;
}
exports.CreateSceneRequestDto = CreateSceneRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '씬 제목',
        example: 'Scene 1 - 주인공 도시 도착',
        maxLength: 200
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateSceneRequestDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '씬 설명',
        example: '주인공이 처음으로 도시에 도착하여 주변을 둘러보는 도입부 씬',
        maxLength: 1000
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateSceneRequestDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '씬 대사',
        example: [
            {
                character: '김철수',
                text: '여기가 바로 그곳이군... 정말 예쁘네.'
            }
        ]
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => DialogueDto),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Array)
], CreateSceneRequestDto.prototype, "dialogues", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '씬 날씨',
        example: '맑음'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSceneRequestDto.prototype, "weather", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
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
    }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => LightingDto),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", LightingDto)
], CreateSceneRequestDto.prototype, "lighting", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '씬 시각 설명',
        example: '도시의 고층빌딩들이 하늘을 가리고, 거리에는 사람들이 바쁘게 오가는 모습'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSceneRequestDto.prototype, "visualDescription", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '씬 장소',
        example: '서울 강남구 테헤란로',
        maxLength: 200
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateSceneRequestDto.prototype, "scenePlace", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '씬 시간',
        example: '2024년 1월 15일 오후 3시',
        maxLength: 200
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateSceneRequestDto.prototype, "sceneDateTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'VFX 필요 여부',
        example: false
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Boolean)
], CreateSceneRequestDto.prototype, "vfxRequired", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'SFX 필요 여부',
        example: true
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Boolean)
], CreateSceneRequestDto.prototype, "sfxRequired", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '예상 지속 시간',
        example: '5분'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSceneRequestDto.prototype, "estimatedDuration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '씬 위치',
        example: {
            name: '서울 강남구 테헤란로',
            address: '서울특별시 강남구 테헤란로 123',
            group_name: '강남구 촬영지'
        }
    }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => RealLocationDto),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", RealLocationDto)
], CreateSceneRequestDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '씬 시간대',
        example: '오후'
    }),
    (0, class_validator_1.IsEnum)(['새벽', '아침', '오후', '저녁', '밤', '낮']),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSceneRequestDto.prototype, "timeOfDay", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
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
    }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CrewDto),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", CrewDto)
], CreateSceneRequestDto.prototype, "crew", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
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
    }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => EquipmentDto),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", EquipmentDto)
], CreateSceneRequestDto.prototype, "equipment", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '출연진',
        example: [
            {
                role: '주인공',
                profileId: '507f1f77bcf86cd799439011'
            },
            {
                role: '조연',
                profileId: '507f1f77bcf86cd799439012'
            }
        ]
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CastMemberDto),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Array)
], CreateSceneRequestDto.prototype, "cast", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
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
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ExtraMemberDto),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Array)
], CreateSceneRequestDto.prototype, "extra", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '특별 요구사항',
        example: ['도시 배경음 필요', '자연스러운 연기']
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Array)
], CreateSceneRequestDto.prototype, "specialRequirements", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '순서',
        example: 1
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateSceneRequestDto.prototype, "order", void 0);
class UpdateSceneRequestDto {
    title;
    description;
    dialogues;
    weather;
    lighting;
    visualDescription;
    scenePlace;
    sceneDateTime;
    vfxRequired;
    sfxRequired;
    estimatedDuration;
    location;
    timeOfDay;
    crew;
    equipment;
    cast;
    extra;
    specialRequirements;
    order;
}
exports.UpdateSceneRequestDto = UpdateSceneRequestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '씬 제목',
        example: 'Scene 1 - 주인공 도시 도착 (수정)',
        maxLength: 200
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateSceneRequestDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '씬 설명',
        example: '주인공이 처음으로 도시에 도착하여 주변을 둘러보는 도입부 씬 (수정됨)',
        maxLength: 1000
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], UpdateSceneRequestDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '씬 대사',
        example: [
            {
                character: '김철수',
                text: '여기가 바로 그곳이군... 정말 예쁘네.'
            }
        ]
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => DialogueDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateSceneRequestDto.prototype, "dialogues", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '씬 날씨',
        example: '맑음'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSceneRequestDto.prototype, "weather", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
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
    }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => LightingDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", LightingDto)
], UpdateSceneRequestDto.prototype, "lighting", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '씬 시각 설명',
        example: '도시의 고층빌딩들이 하늘을 가리고, 거리에는 사람들이 바쁘게 오가는 모습'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSceneRequestDto.prototype, "visualDescription", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '씬 장소',
        example: '서울 강남구 테헤란로'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSceneRequestDto.prototype, "scenePlace", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '씬 시간',
        example: '2024년 1월 15일 오후 3시'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSceneRequestDto.prototype, "sceneDateTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'VFX 필요 여부',
        example: false
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateSceneRequestDto.prototype, "vfxRequired", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'SFX 필요 여부',
        example: true
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateSceneRequestDto.prototype, "sfxRequired", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '예상 지속 시간',
        example: '5분'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSceneRequestDto.prototype, "estimatedDuration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '씬 위치',
        example: {
            name: '서울 강남구 테헤란로',
            address: '서울특별시 강남구 테헤란로 123',
            group_name: '강남구 촬영지'
        }
    }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => RealLocationDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", RealLocationDto)
], UpdateSceneRequestDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '씬 시간대',
        example: '오후'
    }),
    (0, class_validator_1.IsEnum)(['새벽', '아침', '오후', '저녁', '밤', '낮']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSceneRequestDto.prototype, "timeOfDay", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
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
    }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CrewDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", CrewDto)
], UpdateSceneRequestDto.prototype, "crew", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
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
    }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => EquipmentDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", EquipmentDto)
], UpdateSceneRequestDto.prototype, "equipment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '출연진',
        example: [
            {
                role: '주인공',
                profileId: '507f1f77bcf86cd799439011'
            }
        ]
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CastMemberDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateSceneRequestDto.prototype, "cast", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '추가 인원',
        example: [
            {
                role: '단역 1',
                number: 1
            }
        ]
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ExtraMemberDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateSceneRequestDto.prototype, "extra", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '특별 요구사항',
        example: ['도시 배경음 필요', '자연스러운 연기']
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateSceneRequestDto.prototype, "specialRequirements", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '순서',
        example: 1
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateSceneRequestDto.prototype, "order", void 0);
class CreateSceneDraftRequestDto {
    maxScenes;
}
exports.CreateSceneDraftRequestDto = CreateSceneDraftRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성할 씬 개수',
        example: 5,
        minimum: 1,
        maximum: 20
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(20),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateSceneDraftRequestDto.prototype, "maxScenes", void 0);
//# sourceMappingURL=request.dto.js.map