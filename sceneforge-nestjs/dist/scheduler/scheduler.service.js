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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const scheduler_schema_1 = require("./schema/scheduler.schema");
const scene_service_1 = require("../scene/scene.service");
let SchedulerService = class SchedulerService {
    schedulerModel;
    sceneService;
    constructor(schedulerModel, sceneService) {
        this.schedulerModel = schedulerModel;
        this.sceneService = sceneService;
    }
    async create(projectId, createSchedulerDto) {
        const scenes = await this.sceneService.findByProjectId(projectId);
        const scheduler = new this.schedulerModel({
            projectId: new mongoose_2.Types.ObjectId(projectId)
        });
        const savedScheduler = await scheduler.save();
        return savedScheduler;
    }
    async findByProjectId(projectId) {
        const schedulers = await this.schedulerModel.find({
            projectId: new mongoose_2.Types.ObjectId(projectId),
            isDeleted: false
        }).exec();
        return schedulers;
    }
    async findById(projectId, schedulerId) {
        const scheduler = await this.schedulerModel.findOne({
            _id: new mongoose_2.Types.ObjectId(schedulerId),
            projectId: new mongoose_2.Types.ObjectId(projectId),
            isDeleted: false
        }).exec();
        if (!scheduler) {
            throw new common_1.NotFoundException('스케줄러를 찾을 수 없습니다.');
        }
        return scheduler;
    }
    async update(projectId, schedulerId, updateSchedulerDto) {
        const scheduler = await this.schedulerModel.findOneAndUpdate({
            _id: new mongoose_2.Types.ObjectId(schedulerId),
            projectId: new mongoose_2.Types.ObjectId(projectId),
            isDeleted: false
        }, {
            $set: {
                ...updateSchedulerDto
            }
        }, { new: false });
        if (!scheduler) {
            throw new common_1.NotFoundException('스케줄러를 찾을 수 없습니다.');
        }
        return scheduler;
    }
    async delete(projectId, schedulerId) {
        const scheduler = await this.schedulerModel.findOneAndUpdate({
            _id: new mongoose_2.Types.ObjectId(schedulerId),
            projectId: new mongoose_2.Types.ObjectId(projectId),
            isDeleted: false
        });
        if (!scheduler) {
            throw new common_1.NotFoundException('스케줄러를 찾을 수 없습니다.');
        }
        return scheduler;
    }
};
exports.SchedulerService = SchedulerService;
exports.SchedulerService = SchedulerService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(scheduler_schema_1.Scheduler.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        scene_service_1.SceneService])
], SchedulerService);
//# sourceMappingURL=scheduler.service.js.map