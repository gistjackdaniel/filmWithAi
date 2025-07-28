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
exports.SchedulerResponseDto = exports.SchedulerSceneResponseDto = exports.SchedulerTimeRangeResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const mongoose_1 = require("mongoose");
class SchedulerTimeRangeResponseDto {
    start;
    end;
}
exports.SchedulerTimeRangeResponseDto = SchedulerTimeRangeResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '시작 시간',
        example: '09:00'
    }),
    __metadata("design:type", String)
], SchedulerTimeRangeResponseDto.prototype, "start", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '종료 시간',
        example: '17:00'
    }),
    __metadata("design:type", String)
], SchedulerTimeRangeResponseDto.prototype, "end", void 0);
class SchedulerSceneResponseDto {
    scene;
    title;
    description;
    timeOfDay;
    estimatedDuration;
    cast;
    costumes;
    props;
}
exports.SchedulerSceneResponseDto = SchedulerSceneResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '씬 번호',
        example: 1
    }),
    __metadata("design:type", Number)
], SchedulerSceneResponseDto.prototype, "scene", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '씬 제목',
        example: '첫 번째 씬'
    }),
    __metadata("design:type", String)
], SchedulerSceneResponseDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '씬 설명',
        example: '주인공이 도시에 처음 도착하는 씬'
    }),
    __metadata("design:type", String)
], SchedulerSceneResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '시간대',
        example: '낮'
    }),
    __metadata("design:type", String)
], SchedulerSceneResponseDto.prototype, "timeOfDay", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '예상 지속 시간',
        example: '5분'
    }),
    __metadata("design:type", Number)
], SchedulerSceneResponseDto.prototype, "estimatedDuration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '캐스트',
        example: {
            role: '주인공',
            name: '홍길동'
        }
    }),
    __metadata("design:type", Object)
], SchedulerSceneResponseDto.prototype, "cast", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '코스튬',
        example: ['코스튬1', '코스튬2']
    }),
    __metadata("design:type", Array)
], SchedulerSceneResponseDto.prototype, "costumes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '속성',
        example: {
            characterProps: ['속성1', '속성2'],
            setProps: ['속성3', '속성4']
        }
    }),
    __metadata("design:type", Object)
], SchedulerSceneResponseDto.prototype, "props", void 0);
class SchedulerResponseDto {
    _id;
    projectId;
    day;
    date;
    location_groups;
    timeRange;
    scenes;
    estimatedDuration;
    breakdown;
    isDeleted;
}
exports.SchedulerResponseDto = SchedulerResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '스케줄러 ID',
        example: '507f1f77bcf86cd799439011'
    }),
    __metadata("design:type", mongoose_1.Types.ObjectId)
], SchedulerResponseDto.prototype, "_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 ID',
        example: '507f1f77bcf86cd799439011'
    }),
    __metadata("design:type", mongoose_1.Types.ObjectId)
], SchedulerResponseDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '일차',
        example: 1
    }),
    __metadata("design:type", Number)
], SchedulerResponseDto.prototype, "day", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '날짜 표시',
        example: 'Day 1'
    }),
    __metadata("design:type", String)
], SchedulerResponseDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '촬영 장소',
        example: '강의실 101'
    }),
    __metadata("design:type", Array)
], SchedulerResponseDto.prototype, "location_groups", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '시간 범위',
        type: SchedulerTimeRangeResponseDto
    }),
    __metadata("design:type", SchedulerTimeRangeResponseDto)
], SchedulerResponseDto.prototype, "timeRange", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '씬 배열',
        type: [SchedulerSceneResponseDto]
    }),
    __metadata("design:type", Array)
], SchedulerResponseDto.prototype, "scenes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '예상 지속 시간 (분)',
        example: 480
    }),
    __metadata("design:type", Number)
], SchedulerResponseDto.prototype, "estimatedDuration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '브레이크다운 정보',
        example: {
            locations: {},
            actors: {},
            equipment: {}
        }
    }),
    __metadata("design:type", Object)
], SchedulerResponseDto.prototype, "breakdown", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '삭제 여부',
        example: false
    }),
    __metadata("design:type", Boolean)
], SchedulerResponseDto.prototype, "isDeleted", void 0);
//# sourceMappingURL=response.dto.js.map