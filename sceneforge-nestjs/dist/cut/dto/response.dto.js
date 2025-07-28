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
exports.CutResponseDto = exports.CameraSetupResponseDto = exports.SpecialRequirementsResponseDto = exports.SafetyResponseDto = exports.SpecialLightingResponseDto = exports.SpecialEffectsResponseDto = exports.SpecialCinematographyResponseDto = exports.SubjectResponseDto = exports.CameraSettingsResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const mongoose_1 = require("mongoose");
class CameraSettingsResponseDto {
    aperture;
    shutterSpeed;
    iso;
}
exports.CameraSettingsResponseDto = CameraSettingsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '조리개 값', example: 'f/2.8' }),
    __metadata("design:type", String)
], CameraSettingsResponseDto.prototype, "aperture", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '셔터 스피드', example: '1/60' }),
    __metadata("design:type", String)
], CameraSettingsResponseDto.prototype, "shutterSpeed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ISO 값', example: '800' }),
    __metadata("design:type", String)
], CameraSettingsResponseDto.prototype, "iso", void 0);
class SubjectResponseDto {
    name;
    type;
    position;
    action;
    emotion;
    description;
}
exports.SubjectResponseDto = SubjectResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '피사체 이름', example: '김철수' }),
    __metadata("design:type", String)
], SubjectResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '피사체 타입',
        enum: ['character', 'object', 'animal', 'background'],
        example: 'character'
    }),
    __metadata("design:type", String)
], SubjectResponseDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '위치', example: '화면 중앙' }),
    __metadata("design:type", String)
], SubjectResponseDto.prototype, "position", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '행동/움직임', example: '천천히 걷기' }),
    __metadata("design:type", String)
], SubjectResponseDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '감정', example: '차분함' }),
    __metadata("design:type", String)
], SubjectResponseDto.prototype, "emotion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '설명', example: '주인공이 도시 거리를 천천히 걷는 모습' }),
    __metadata("design:type", String)
], SubjectResponseDto.prototype, "description", void 0);
class SpecialCinematographyResponseDto {
    drone;
    crane;
    jib;
    underwater;
    aerial;
}
exports.SpecialCinematographyResponseDto = SpecialCinematographyResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '드론 촬영 필요 여부', example: false }),
    __metadata("design:type", Boolean)
], SpecialCinematographyResponseDto.prototype, "drone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '크레인 촬영 필요 여부', example: false }),
    __metadata("design:type", Boolean)
], SpecialCinematographyResponseDto.prototype, "crane", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '집 촬영 필요 여부', example: false }),
    __metadata("design:type", Boolean)
], SpecialCinematographyResponseDto.prototype, "jib", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '수중 촬영 필요 여부', example: false }),
    __metadata("design:type", Boolean)
], SpecialCinematographyResponseDto.prototype, "underwater", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '공중 촬영 필요 여부', example: false }),
    __metadata("design:type", Boolean)
], SpecialCinematographyResponseDto.prototype, "aerial", void 0);
class SpecialEffectsResponseDto {
    vfx;
    pyrotechnics;
    smoke;
    fog;
    wind;
    rain;
    snow;
    fire;
    explosion;
    stunt;
}
exports.SpecialEffectsResponseDto = SpecialEffectsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'VFX 필요 여부', example: false }),
    __metadata("design:type", Boolean)
], SpecialEffectsResponseDto.prototype, "vfx", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '폭발 효과 필요 여부', example: false }),
    __metadata("design:type", Boolean)
], SpecialEffectsResponseDto.prototype, "pyrotechnics", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '연기 효과 필요 여부', example: false }),
    __metadata("design:type", Boolean)
], SpecialEffectsResponseDto.prototype, "smoke", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '안개 효과 필요 여부', example: false }),
    __metadata("design:type", Boolean)
], SpecialEffectsResponseDto.prototype, "fog", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '바람 효과 필요 여부', example: false }),
    __metadata("design:type", Boolean)
], SpecialEffectsResponseDto.prototype, "wind", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '비 효과 필요 여부', example: false }),
    __metadata("design:type", Boolean)
], SpecialEffectsResponseDto.prototype, "rain", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '눈 효과 필요 여부', example: false }),
    __metadata("design:type", Boolean)
], SpecialEffectsResponseDto.prototype, "snow", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '불 효과 필요 여부', example: false }),
    __metadata("design:type", Boolean)
], SpecialEffectsResponseDto.prototype, "fire", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '폭발 필요 여부', example: false }),
    __metadata("design:type", Boolean)
], SpecialEffectsResponseDto.prototype, "explosion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '스턴트 필요 여부', example: false }),
    __metadata("design:type", Boolean)
], SpecialEffectsResponseDto.prototype, "stunt", void 0);
class SpecialLightingResponseDto {
    laser;
    strobe;
    blackLight;
    uvLight;
    movingLight;
    colorChanger;
}
exports.SpecialLightingResponseDto = SpecialLightingResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '레이저 조명 필요 여부', example: false }),
    __metadata("design:type", Boolean)
], SpecialLightingResponseDto.prototype, "laser", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '스트로브 조명 필요 여부', example: false }),
    __metadata("design:type", Boolean)
], SpecialLightingResponseDto.prototype, "strobe", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '블랙라이트 필요 여부', example: false }),
    __metadata("design:type", Boolean)
], SpecialLightingResponseDto.prototype, "blackLight", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'UV 라이트 필요 여부', example: false }),
    __metadata("design:type", Boolean)
], SpecialLightingResponseDto.prototype, "uvLight", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '무빙라이트 필요 여부', example: false }),
    __metadata("design:type", Boolean)
], SpecialLightingResponseDto.prototype, "movingLight", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '컬러체인저 필요 여부', example: false }),
    __metadata("design:type", Boolean)
], SpecialLightingResponseDto.prototype, "colorChanger", void 0);
class SafetyResponseDto {
    requiresMedic;
    requiresFireSafety;
    requiresSafetyOfficer;
}
exports.SafetyResponseDto = SafetyResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '의료진 필요 여부', example: false }),
    __metadata("design:type", Boolean)
], SafetyResponseDto.prototype, "requiresMedic", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '소방 안전 필요 여부', example: false }),
    __metadata("design:type", Boolean)
], SafetyResponseDto.prototype, "requiresFireSafety", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '안전 담당관 필요 여부', example: false }),
    __metadata("design:type", Boolean)
], SafetyResponseDto.prototype, "requiresSafetyOfficer", void 0);
class SpecialRequirementsResponseDto {
    specialCinematography;
    specialEffects;
    specialLighting;
    safety;
}
exports.SpecialRequirementsResponseDto = SpecialRequirementsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '특수 촬영 요구사항', type: SpecialCinematographyResponseDto }),
    __metadata("design:type", SpecialCinematographyResponseDto)
], SpecialRequirementsResponseDto.prototype, "specialCinematography", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '특수 효과 요구사항', type: SpecialEffectsResponseDto }),
    __metadata("design:type", SpecialEffectsResponseDto)
], SpecialRequirementsResponseDto.prototype, "specialEffects", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '특수 조명 요구사항', type: SpecialLightingResponseDto }),
    __metadata("design:type", SpecialLightingResponseDto)
], SpecialRequirementsResponseDto.prototype, "specialLighting", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '안전 요구사항', type: SafetyResponseDto }),
    __metadata("design:type", SafetyResponseDto)
], SpecialRequirementsResponseDto.prototype, "safety", void 0);
class CameraSetupResponseDto {
    shotSize;
    angleDirection;
    cameraMovement;
    lensSpecs;
    cameraSettings;
}
exports.CameraSetupResponseDto = CameraSetupResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '샷 사이즈',
        enum: [
            'EWS', 'VWS', 'WS', 'FS', 'LS', 'MLS', 'MS', 'MCS', 'CU', 'MCU', 'BCU', 'ECU', 'TCU',
            'OTS', 'POV', 'TS', 'GS', 'AS', 'PS', 'BS'
        ],
        example: 'MS'
    }),
    __metadata("design:type", String)
], CameraSetupResponseDto.prototype, "shotSize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '앵글 방향',
        enum: [
            'Eye-level', 'High', 'Low', 'Dutch', 'Bird_eye', 'Worm_eye', 'Canted', 'Oblique',
            'Aerial', 'Ground', 'Overhead', 'Under', 'Side', 'Front', 'Back', 'Three_quarter',
            'Profile', 'Reverse', 'POV', 'Subjective'
        ],
        example: 'Eye-level'
    }),
    __metadata("design:type", String)
], CameraSetupResponseDto.prototype, "angleDirection", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '카메라 움직임',
        enum: [
            'Static', 'Pan', 'Tilt', 'Dolly', 'Zoom', 'Handheld', 'Tracking', 'Crane', 'Steadicam',
            'Gimbal', 'Drone', 'Jib', 'Slider', 'Dolly_zoom', 'Arc', 'Circle', 'Spiral', 'Vertigo',
            'Whip_pan', 'Crash_zoom', 'Push_in', 'Pull_out', 'Follow', 'Lead', 'Reveal', 'Conceal',
            'Parallax', 'Time_lapse', 'Slow_motion', 'Fast_motion', 'Bullet_time', 'Matrix_style',
            '360_degree', 'VR_style'
        ],
        example: 'Static'
    }),
    __metadata("design:type", String)
], CameraSetupResponseDto.prototype, "cameraMovement", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '렌즈 사양', example: '50mm f/1.8' }),
    __metadata("design:type", String)
], CameraSetupResponseDto.prototype, "lensSpecs", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '카메라 설정', type: CameraSettingsResponseDto }),
    __metadata("design:type", CameraSettingsResponseDto)
], CameraSetupResponseDto.prototype, "cameraSettings", void 0);
class CutResponseDto {
    _id;
    sceneId;
    projectId;
    title;
    description;
    cameraSetup;
    vfxEffects;
    soundEffects;
    directorNotes;
    dialogue;
    narration;
    subjectMovement;
    productionMethod;
    productionMethodReason;
    estimatedDuration;
    specialRequirements;
    imageUrl;
    order;
    isDeleted;
}
exports.CutResponseDto = CutResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '컷 ID', example: '507f1f77bcf86cd799439011' }),
    __metadata("design:type", mongoose_1.Types.ObjectId)
], CutResponseDto.prototype, "_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '씬 ID', example: '507f1f77bcf86cd799439011' }),
    __metadata("design:type", mongoose_1.Types.ObjectId)
], CutResponseDto.prototype, "sceneId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' }),
    __metadata("design:type", mongoose_1.Types.ObjectId)
], CutResponseDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '컷 제목', example: 'Shot 1 - 주인공 도시 거리 걷기' }),
    __metadata("design:type", String)
], CutResponseDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '컷 설명', example: '주인공이 도시 거리를 천천히 걸으며 주변을 둘러보는 컷' }),
    __metadata("design:type", String)
], CutResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '카메라 설정', type: CameraSetupResponseDto }),
    __metadata("design:type", CameraSetupResponseDto)
], CutResponseDto.prototype, "cameraSetup", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'VFX 효과', example: '도시 배경 합성, 안개 효과' }),
    __metadata("design:type", String)
], CutResponseDto.prototype, "vfxEffects", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '음향 효과', example: '도시 배경음, 발걸음 소리' }),
    __metadata("design:type", String)
], CutResponseDto.prototype, "soundEffects", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '감독 노트', example: '자연스러운 걷기 연기, 주변을 둘러보는 시선 처리' }),
    __metadata("design:type", String)
], CutResponseDto.prototype, "directorNotes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '대사', example: '여기가 바로 그곳이군...' }),
    __metadata("design:type", String)
], CutResponseDto.prototype, "dialogue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '내레이션', example: '그날, 그는 처음으로 이 도시에 발을 들였다' }),
    __metadata("design:type", String)
], CutResponseDto.prototype, "narration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '피사체 움직임', type: [SubjectResponseDto] }),
    __metadata("design:type", Array)
], CutResponseDto.prototype, "subjectMovement", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '제작 방법',
        enum: ['live_action', 'ai_generated'],
        example: 'live_action'
    }),
    __metadata("design:type", String)
], CutResponseDto.prototype, "productionMethod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '제작 방법 선택 근거', example: '실사 촬영으로 자연스러운 도시 분위기 연출' }),
    __metadata("design:type", String)
], CutResponseDto.prototype, "productionMethodReason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '예상 지속 시간 (초)', example: 8 }),
    __metadata("design:type", Number)
], CutResponseDto.prototype, "estimatedDuration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '특수 요구사항', type: SpecialRequirementsResponseDto }),
    __metadata("design:type", SpecialRequirementsResponseDto)
], CutResponseDto.prototype, "specialRequirements", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '이미지 URL', example: 'https://api.example.com/cuts/shot1_preview.jpg' }),
    __metadata("design:type", String)
], CutResponseDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '순서', example: 1 }),
    __metadata("design:type", Number)
], CutResponseDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '삭제 여부', example: false }),
    __metadata("design:type", Boolean)
], CutResponseDto.prototype, "isDeleted", void 0);
//# sourceMappingURL=response.dto.js.map