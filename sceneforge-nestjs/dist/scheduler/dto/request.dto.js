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
exports.UpdateSchedulerRequestDto = exports.CreateSchedulerRequestDto = exports.SchedulerSceneDto = exports.SchedulerTimeRangeDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class SchedulerTimeRangeDto {
    start;
    end;
}
exports.SchedulerTimeRangeDto = SchedulerTimeRangeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '시작 시간',
        example: '09:00'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SchedulerTimeRangeDto.prototype, "start", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '종료 시간',
        example: '17:00'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SchedulerTimeRangeDto.prototype, "end", void 0);
class SchedulerSceneDto {
    scene;
    title;
    description;
    timeOfDay;
    cast;
    estimatedDuration;
    costumes;
    props;
}
exports.SchedulerSceneDto = SchedulerSceneDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '씬 번호',
        example: 1
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], SchedulerSceneDto.prototype, "scene", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '씬 제목',
        example: '첫 번째 씬'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SchedulerSceneDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '씬 설명',
        example: '주인공이 도시에 처음 도착하는 씬'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SchedulerSceneDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '시간대',
        example: '낮',
        enum: ['낮', '밤', '미정']
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SchedulerSceneDto.prototype, "timeOfDay", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '캐스트',
        example: {
            role: '주인공',
            name: '홍길동'
        }
    }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Object)
], SchedulerSceneDto.prototype, "cast", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '예상 지속 시간',
        example: 5
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], SchedulerSceneDto.prototype, "estimatedDuration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '코스튬',
        example: ['코스튬1', '코스튬2']
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Array)
], SchedulerSceneDto.prototype, "costumes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '속성',
        example: {
            characterProps: ['속성1', '속성2'],
            setProps: ['속성3', '속성4']
        }
    }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Object)
], SchedulerSceneDto.prototype, "props", void 0);
class CreateSchedulerRequestDto {
    maxDailyHours;
    maxWeeklyHours;
    restDay;
}
exports.CreateSchedulerRequestDto = CreateSchedulerRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '최대 일일 촬영 시간',
        example: 10
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateSchedulerRequestDto.prototype, "maxDailyHours", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '최대 주간 촬영 시간',
        example: 10
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateSchedulerRequestDto.prototype, "maxWeeklyHours", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '휴게 일',
        example: 1
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateSchedulerRequestDto.prototype, "restDay", void 0);
class UpdateSchedulerRequestDto {
    day;
    date;
    location;
    timeOfDay;
    timeRange;
    scenes;
    estimatedDuration;
    breakdown;
}
exports.UpdateSchedulerRequestDto = UpdateSchedulerRequestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '일차',
        example: 1
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateSchedulerRequestDto.prototype, "day", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '날짜 표시',
        example: 'Day 1'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSchedulerRequestDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '촬영 장소',
        example: '강의실 101'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSchedulerRequestDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '시간대',
        example: '낮',
        enum: ['낮', '밤', '미정']
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSchedulerRequestDto.prototype, "timeOfDay", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '시간 범위',
        type: SchedulerTimeRangeDto
    }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => SchedulerTimeRangeDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", SchedulerTimeRangeDto)
], UpdateSchedulerRequestDto.prototype, "timeRange", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '씬 배열',
        type: [SchedulerSceneDto]
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SchedulerSceneDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateSchedulerRequestDto.prototype, "scenes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '예상 지속 시간 (분)',
        example: 480
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateSchedulerRequestDto.prototype, "estimatedDuration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '브레이크다운 정보',
        example: {
            locations: {},
            actors: {},
            equipment: {}
        }
    }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateSchedulerRequestDto.prototype, "breakdown", void 0);
//# sourceMappingURL=request.dto.js.map