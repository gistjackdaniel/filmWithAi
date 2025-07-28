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
exports.ProjectService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const project_schema_1 = require("./schema/project.schema");
const profile_service_1 = require("../profile/profile.service");
let ProjectService = class ProjectService {
    projectModel;
    profileService;
    constructor(projectModel, profileService) {
        this.projectModel = projectModel;
        this.profileService = profileService;
    }
    async create(ownerId, createProjectRequestDto) {
        const createdProject = new this.projectModel({
            ...createProjectRequestDto,
            ownerId: new mongoose_2.Types.ObjectId(ownerId),
            participants: [new mongoose_2.Types.ObjectId(ownerId)],
        });
        const pushResult = await this.profileService.pushProject(ownerId, createdProject._id.toString());
        if (!pushResult) {
            throw new common_1.BadRequestException();
        }
        const savedProject = await createdProject.save();
        return savedProject;
    }
    async searchParticipatingProjects(searchProjectRequestDto) {
        const result = await this.projectModel.find({
            participants: { $in: [new mongoose_2.Types.ObjectId(searchProjectRequestDto.profileId)] },
            isDeleted: false,
        });
        return result;
    }
    async findById(projectId) {
        const project = await this.projectModel.findOne({
            _id: new mongoose_2.Types.ObjectId(projectId),
            isDeleted: false,
        });
        if (!project) {
            throw new common_1.NotFoundException('프로젝트를 찾을 수 없습니다.');
        }
        return project;
    }
    async findParticipatingOne(findProjectDetailRequestDto) {
        const project = await this.projectModel.findOne({
            _id: new mongoose_2.Types.ObjectId(findProjectDetailRequestDto._id),
            participants: { $in: [new mongoose_2.Types.ObjectId(findProjectDetailRequestDto.profileId)] },
            isDeleted: false,
        });
        if (!project) {
            throw new common_1.NotFoundException('프로젝트를 찾을 수 없습니다.');
        }
        return project;
    }
    async update(ownerId, projectId, updateProjectRequestDto) {
        const project = await this.projectModel.findOneAndUpdate({
            _id: new mongoose_2.Types.ObjectId(projectId),
            ownerId: new mongoose_2.Types.ObjectId(ownerId),
            isDeleted: false,
        }, { ...updateProjectRequestDto, updatedAt: new Date() }, { new: false });
        if (!project) {
            throw new common_1.NotFoundException('프로젝트를 찾을 수 없습니다.');
        }
        return project;
    }
    async delete(deleteProjectRequestDto) {
        const project = await this.projectModel.findOneAndUpdate({
            _id: new mongoose_2.Types.ObjectId(deleteProjectRequestDto._id),
            ownerId: new mongoose_2.Types.ObjectId(deleteProjectRequestDto.profileId),
            isDeleted: false,
        }, { isDeleted: true }, { new: false });
        if (!project) {
            throw new common_1.NotFoundException('프로젝트를 찾을 수 없습니다.');
        }
        for (const participant of project.participants) {
            const pullResult = await this.profileService.pullProject(participant.toString(), project._id.toString());
            if (!pullResult) {
                console.error(`Failed to pull project ${project._id.toString()} from participant ${participant.toString()}`);
            }
        }
        return project;
    }
    async updateLastViewed(profileId, projectId) {
        await this.projectModel.findOneAndUpdate({
            _id: new mongoose_2.Types.ObjectId(projectId),
            participants: { $in: [new mongoose_2.Types.ObjectId(profileId)] },
            isDeleted: false,
        }, { lastViewedAt: new Date() });
    }
    async restoreProject(restoreProjectRequestDto) {
        const project = await this.projectModel.findOneAndUpdate({
            _id: restoreProjectRequestDto.projectId,
            ownerId: new mongoose_2.Types.ObjectId(restoreProjectRequestDto.profileId),
            isDeleted: true,
        }, { isDeleted: false }, { new: false });
        if (!project) {
            throw new common_1.NotFoundException('삭제된 프로젝트를 찾을 수 없습니다.');
        }
        return project;
    }
    async searchFavorites(searchProjectRequestDto) {
        const profile = await this.profileService.findProfileById(searchProjectRequestDto.profileId);
        if (!profile) {
            throw new common_1.NotFoundException('프로필을 찾을 수 없습니다.');
        }
        const projects = await this.projectModel.find({
            _id: { $in: profile.projects.filter(project => project.isFavorite).map(project => project.projectId) },
            isDeleted: false,
        });
        return projects;
    }
};
exports.ProjectService = ProjectService;
exports.ProjectService = ProjectService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(project_schema_1.Project.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        profile_service_1.ProfileService])
], ProjectService);
//# sourceMappingURL=project.service.js.map