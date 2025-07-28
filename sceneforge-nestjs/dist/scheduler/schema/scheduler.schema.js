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
exports.SchedulerSchema = exports.Scheduler = exports.SchedulerScene = exports.SchedulerTimeRange = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let SchedulerTimeRange = class SchedulerTimeRange {
    start;
    end;
};
exports.SchedulerTimeRange = SchedulerTimeRange;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], SchedulerTimeRange.prototype, "start", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], SchedulerTimeRange.prototype, "end", void 0);
exports.SchedulerTimeRange = SchedulerTimeRange = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], SchedulerTimeRange);
let SchedulerScene = class SchedulerScene {
    scene;
    title;
    description;
    location;
    timeOfDay;
    cast;
    estimatedDuration;
    costumes;
    props;
};
exports.SchedulerScene = SchedulerScene;
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], SchedulerScene.prototype, "scene", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], SchedulerScene.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], SchedulerScene.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, required: true }),
    __metadata("design:type", Object)
], SchedulerScene.prototype, "location", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], SchedulerScene.prototype, "timeOfDay", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Object], required: true }),
    __metadata("design:type", Object)
], SchedulerScene.prototype, "cast", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], SchedulerScene.prototype, "estimatedDuration", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], required: true }),
    __metadata("design:type", Array)
], SchedulerScene.prototype, "costumes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, required: true }),
    __metadata("design:type", Object)
], SchedulerScene.prototype, "props", void 0);
exports.SchedulerScene = SchedulerScene = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], SchedulerScene);
let Scheduler = class Scheduler {
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
};
exports.Scheduler = Scheduler;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: 'Project',
        required: true,
        index: true
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Scheduler.prototype, "projectId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], Scheduler.prototype, "day", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], Scheduler.prototype, "date", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], required: true }),
    __metadata("design:type", Array)
], Scheduler.prototype, "location_groups", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: SchedulerTimeRange, required: true }),
    __metadata("design:type", SchedulerTimeRange)
], Scheduler.prototype, "timeRange", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [SchedulerScene], required: true }),
    __metadata("design:type", Array)
], Scheduler.prototype, "scenes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], Scheduler.prototype, "estimatedDuration", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], Scheduler.prototype, "breakdown", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: Boolean,
        default: false
    }),
    __metadata("design:type", Boolean)
], Scheduler.prototype, "isDeleted", void 0);
exports.Scheduler = Scheduler = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Scheduler);
exports.SchedulerSchema = mongoose_1.SchemaFactory.createForClass(Scheduler);
//# sourceMappingURL=scheduler.schema.js.map