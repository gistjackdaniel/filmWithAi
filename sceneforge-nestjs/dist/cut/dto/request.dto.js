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
exports.CreateCutDraftRequestDto = exports.UpdateCutRequestDto = exports.CreateCutRequestDto = exports.CameraSetupDto = exports.SpecialRequirementsDto = exports.SafetyDto = exports.SpecialLightingDto = exports.SpecialEffectsDto = exports.SpecialCinematographyDto = exports.SubjectDto = exports.CameraSettingsDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const mongoose_1 = require("mongoose");
class CameraSettingsDto {
    aperture;
    shutterSpeed;
    iso;
}
exports.CameraSettingsDto = CameraSettingsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '조리개 값', example: 'f/2.8' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CameraSettingsDto.prototype, "aperture", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '셔터 스피드', example: '1/60' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CameraSettingsDto.prototype, "shutterSpeed", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ISO 값', example: '800' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CameraSettingsDto.prototype, "iso", void 0);
class SubjectDto {
    name;
    type;
    position;
    action;
    emotion;
    description;
}
exports.SubjectDto = SubjectDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '피사체 이름', example: '김철수' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SubjectDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '피사체 타입',
        enum: ['character', 'object', 'animal', 'background'],
        example: 'character'
    }),
    (0, class_validator_1.IsEnum)(['character', 'object', 'animal', 'background']),
    __metadata("design:type", String)
], SubjectDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '위치', example: '화면 중앙' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], SubjectDto.prototype, "position", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '행동/움직임', example: '천천히 걷기' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], SubjectDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '감정', example: '차분함' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], SubjectDto.prototype, "emotion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '설명', example: '주인공이 도시 거리를 천천히 걷는 모습' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], SubjectDto.prototype, "description", void 0);
class SpecialCinematographyDto {
    drone;
    crane;
    jib;
    underwater;
    aerial;
}
exports.SpecialCinematographyDto = SpecialCinematographyDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '드론 촬영 필요 여부', example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SpecialCinematographyDto.prototype, "drone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '크레인 촬영 필요 여부', example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SpecialCinematographyDto.prototype, "crane", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '집 촬영 필요 여부', example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SpecialCinematographyDto.prototype, "jib", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '수중 촬영 필요 여부', example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SpecialCinematographyDto.prototype, "underwater", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '공중 촬영 필요 여부', example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SpecialCinematographyDto.prototype, "aerial", void 0);
class SpecialEffectsDto {
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
exports.SpecialEffectsDto = SpecialEffectsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'VFX 필요 여부', example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SpecialEffectsDto.prototype, "vfx", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '폭발 효과 필요 여부', example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SpecialEffectsDto.prototype, "pyrotechnics", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '연기 효과 필요 여부', example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SpecialEffectsDto.prototype, "smoke", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '안개 효과 필요 여부', example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SpecialEffectsDto.prototype, "fog", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '바람 효과 필요 여부', example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SpecialEffectsDto.prototype, "wind", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '비 효과 필요 여부', example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SpecialEffectsDto.prototype, "rain", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '눈 효과 필요 여부', example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SpecialEffectsDto.prototype, "snow", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '불 효과 필요 여부', example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SpecialEffectsDto.prototype, "fire", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '폭발 필요 여부', example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SpecialEffectsDto.prototype, "explosion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '스턴트 필요 여부', example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SpecialEffectsDto.prototype, "stunt", void 0);
class SpecialLightingDto {
    laser;
    strobe;
    blackLight;
    uvLight;
    movingLight;
    colorChanger;
}
exports.SpecialLightingDto = SpecialLightingDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '레이저 조명 필요 여부', example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SpecialLightingDto.prototype, "laser", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '스트로브 조명 필요 여부', example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SpecialLightingDto.prototype, "strobe", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '블랙라이트 필요 여부', example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SpecialLightingDto.prototype, "blackLight", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'UV 라이트 필요 여부', example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SpecialLightingDto.prototype, "uvLight", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '무빙라이트 필요 여부', example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SpecialLightingDto.prototype, "movingLight", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '컬러체인저 필요 여부', example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SpecialLightingDto.prototype, "colorChanger", void 0);
class SafetyDto {
    requiresMedic;
    requiresFireSafety;
    requiresSafetyOfficer;
}
exports.SafetyDto = SafetyDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '의료진 필요 여부', example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SafetyDto.prototype, "requiresMedic", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '소방 안전 필요 여부', example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SafetyDto.prototype, "requiresFireSafety", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '안전 담당관 필요 여부', example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SafetyDto.prototype, "requiresSafetyOfficer", void 0);
class SpecialRequirementsDto {
    specialCinematography;
    specialEffects;
    specialLighting;
    safety;
}
exports.SpecialRequirementsDto = SpecialRequirementsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '특수 촬영 요구사항', type: SpecialCinematographyDto }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => SpecialCinematographyDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", SpecialCinematographyDto)
], SpecialRequirementsDto.prototype, "specialCinematography", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '특수 효과 요구사항', type: SpecialEffectsDto }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => SpecialEffectsDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", SpecialEffectsDto)
], SpecialRequirementsDto.prototype, "specialEffects", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '특수 조명 요구사항', type: SpecialLightingDto }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => SpecialLightingDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", SpecialLightingDto)
], SpecialRequirementsDto.prototype, "specialLighting", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '안전 요구사항', type: SafetyDto }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => SafetyDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", SafetyDto)
], SpecialRequirementsDto.prototype, "safety", void 0);
class CameraSetupDto {
    shotSize;
    angleDirection;
    cameraMovement;
    lensSpecs;
    cameraSettings;
}
exports.CameraSetupDto = CameraSetupDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '샷 사이즈',
        enum: [
            'EWS', 'VWS', 'WS', 'FS', 'LS', 'MLS', 'MS', 'MCS', 'CU', 'MCU', 'BCU', 'ECU', 'TCU',
            'OTS', 'POV', 'TS', 'GS', 'AS', 'PS', 'BS'
        ],
        example: 'MS'
    }),
    (0, class_validator_1.IsEnum)([
        'EWS', 'VWS', 'WS', 'FS', 'LS', 'MLS', 'MS', 'MCS', 'CU', 'MCU', 'BCU', 'ECU', 'TCU',
        'OTS', 'POV', 'TS', 'GS', 'AS', 'PS', 'BS'
    ]),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CameraSetupDto.prototype, "shotSize", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '앵글 방향',
        enum: [
            'Eye-level', 'High', 'Low', 'Dutch', 'Bird_eye', 'Worm_eye', 'Canted', 'Oblique',
            'Aerial', 'Ground', 'Overhead', 'Under', 'Side', 'Front', 'Back', 'Three_quarter',
            'Profile', 'Reverse', 'POV', 'Subjective'
        ],
        example: 'Eye-level'
    }),
    (0, class_validator_1.IsEnum)([
        'Eye-level', 'High', 'Low', 'Dutch', 'Bird_eye', 'Worm_eye', 'Canted', 'Oblique',
        'Aerial', 'Ground', 'Overhead', 'Under', 'Side', 'Front', 'Back', 'Three_quarter',
        'Profile', 'Reverse', 'POV', 'Subjective'
    ]),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CameraSetupDto.prototype, "angleDirection", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
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
    (0, class_validator_1.IsEnum)([
        'Static', 'Pan', 'Tilt', 'Dolly', 'Zoom', 'Handheld', 'Tracking', 'Crane', 'Steadicam',
        'Gimbal', 'Drone', 'Jib', 'Slider', 'Dolly_zoom', 'Arc', 'Circle', 'Spiral', 'Vertigo',
        'Whip_pan', 'Crash_zoom', 'Push_in', 'Pull_out', 'Follow', 'Lead', 'Reveal', 'Conceal',
        'Parallax', 'Time_lapse', 'Slow_motion', 'Fast_motion', 'Bullet_time', 'Matrix_style',
        '360_degree', 'VR_style'
    ]),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CameraSetupDto.prototype, "cameraMovement", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '렌즈 사양', example: '50mm f/1.8', maxLength: 200 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CameraSetupDto.prototype, "lensSpecs", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '카메라 설정', type: CameraSettingsDto }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CameraSettingsDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", CameraSettingsDto)
], CameraSetupDto.prototype, "cameraSettings", void 0);
class CreateCutRequestDto {
    sceneId;
    projectId;
    order;
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
}
exports.CreateCutRequestDto = CreateCutRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '씬 ID',
        example: '507f1f77bcf86cd799439011'
    }),
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", mongoose_1.Types.ObjectId)
], CreateCutRequestDto.prototype, "sceneId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 ID',
        example: '507f1f77bcf86cd799439011'
    }),
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", mongoose_1.Types.ObjectId)
], CreateCutRequestDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '순서',
        example: 1,
        minimum: 1
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateCutRequestDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '컷 제목',
        example: 'Shot 1 - 주인공 도시 거리 걷기',
        maxLength: 200
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCutRequestDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '컷 설명',
        example: '주인공이 도시 거리를 천천히 걸으며 주변을 둘러보는 컷',
        maxLength: 1000
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(1000),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCutRequestDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '카메라 설정', type: CameraSetupDto }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CameraSetupDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", CameraSetupDto)
], CreateCutRequestDto.prototype, "cameraSetup", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'VFX 효과', example: '특수 효과 없음', maxLength: 500 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateCutRequestDto.prototype, "vfxEffects", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '음향 효과', example: '배경음', maxLength: 500 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateCutRequestDto.prototype, "soundEffects", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '감독 노트', example: '자연스러운 연기 부탁', maxLength: 1000 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateCutRequestDto.prototype, "directorNotes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '대사', example: '안녕하세요', maxLength: 200 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateCutRequestDto.prototype, "dialogue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '내레이션', example: '그날은 특별한 날이었다', maxLength: 200 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateCutRequestDto.prototype, "narration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '피사체 움직임', type: [SubjectDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SubjectDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateCutRequestDto.prototype, "subjectMovement", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '제작 방법',
        enum: ['live_action', 'ai_generated'],
        example: 'live_action'
    }),
    (0, class_validator_1.IsEnum)(['live_action', 'ai_generated']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCutRequestDto.prototype, "productionMethod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '제작 방법 선택 근거', example: '실사 촬영으로 자연스러운 도시 분위기 연출', maxLength: 500 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateCutRequestDto.prototype, "productionMethodReason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '예상 지속 시간 (초)',
        example: 8,
        minimum: 1,
        maximum: 300
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(300),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateCutRequestDto.prototype, "estimatedDuration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '특수 요구사항', type: SpecialRequirementsDto }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => SpecialRequirementsDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", SpecialRequirementsDto)
], CreateCutRequestDto.prototype, "specialRequirements", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '이미지 URL', example: 'https://api.example.com/cuts/shot1_preview.jpg' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCutRequestDto.prototype, "imageUrl", void 0);
class UpdateCutRequestDto {
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
}
exports.UpdateCutRequestDto = UpdateCutRequestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '컷 제목',
        example: 'Shot 1 - 주인공 도시 거리 걷기 (수정)',
        maxLength: 200
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(200),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateCutRequestDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '컷 설명',
        example: '주인공이 도시 거리를 천천히 걸으며 주변을 둘러보는 컷 (수정됨)',
        maxLength: 1000
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(1000),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateCutRequestDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '카메라 설정', type: CameraSetupDto }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CameraSetupDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", CameraSetupDto)
], UpdateCutRequestDto.prototype, "cameraSetup", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'VFX 효과', example: '특수 효과 없음', maxLength: 500 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateCutRequestDto.prototype, "vfxEffects", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '음향 효과', example: '배경음', maxLength: 500 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateCutRequestDto.prototype, "soundEffects", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '감독 노트', example: '자연스러운 연기 부탁', maxLength: 1000 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], UpdateCutRequestDto.prototype, "directorNotes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '대사', example: '안녕하세요', maxLength: 200 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateCutRequestDto.prototype, "dialogue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '내레이션', example: '그날은 특별한 날이었다', maxLength: 200 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateCutRequestDto.prototype, "narration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '피사체 움직임', type: [SubjectDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SubjectDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateCutRequestDto.prototype, "subjectMovement", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '제작 방법',
        enum: ['live_action', 'ai_generated'],
        example: 'live_action'
    }),
    (0, class_validator_1.IsEnum)(['live_action', 'ai_generated']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCutRequestDto.prototype, "productionMethod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '제작 방법 선택 근거', example: '실사 촬영이 더 자연스럽다', maxLength: 500 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateCutRequestDto.prototype, "productionMethodReason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '예상 지속 시간 (초)',
        example: 5,
        minimum: 1,
        maximum: 300
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(300),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateCutRequestDto.prototype, "estimatedDuration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '특수 요구사항', type: SpecialRequirementsDto }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => SpecialRequirementsDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", SpecialRequirementsDto)
], UpdateCutRequestDto.prototype, "specialRequirements", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '이미지 URL', example: 'https://example.com/image.jpg' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCutRequestDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '순서', example: 0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateCutRequestDto.prototype, "order", void 0);
class CreateCutDraftRequestDto {
    maxCuts;
    genre;
}
exports.CreateCutDraftRequestDto = CreateCutDraftRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '최대 컷 수',
        example: 1,
        minimum: 1,
        maximum: 10
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], CreateCutDraftRequestDto.prototype, "maxCuts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '장르',
        example: '드라마',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCutDraftRequestDto.prototype, "genre", void 0);
//# sourceMappingURL=request.dto.js.map