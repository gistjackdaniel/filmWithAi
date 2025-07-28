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
exports.ProfileService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const profile_schema_1 = require("./schema/profile.schema");
let ProfileService = class ProfileService {
    profileModel;
    constructor(profileModel) {
        this.profileModel = profileModel;
    }
    async findProfileById(profileId) {
        const profile = await this.profileModel.findById(profileId);
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        return profile;
    }
    async createProfile(createProfileDto) {
        const createdProfile = new this.profileModel(createProfileDto);
        const savedProfile = await createdProfile.save();
        return savedProfile;
    }
    async createOrUpdateLastLogin(createProfileRequestDto) {
        const updatedProfile = await this.profileModel.findOneAndUpdate({ googleId: createProfileRequestDto.googleId }, { lastLoginAt: new Date() }, { new: false });
        if (!updatedProfile) {
            const createdProfile = new this.profileModel(createProfileRequestDto);
            const savedProfile = await createdProfile.save();
            return savedProfile;
        }
        return updatedProfile;
    }
    async deleteProfile(deleteProfileDto) {
        const deletedProfile = await this.profileModel.findOneAndUpdate({ _id: deleteProfileDto.profileId }, { isDeleted: true });
        if (!deletedProfile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        return deletedProfile;
    }
    async updateLastLogin(googleId) {
        const updatedProfile = await this.profileModel.findOneAndUpdate({ googleId }, { lastLoginAt: new Date() }, { new: false });
        if (!updatedProfile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        return updatedProfile;
    }
    async pushProject(profileId, projectId) {
        const profile = await this.profileModel.findOne({
            _id: profileId,
            isDeleted: false,
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        if (profile.projects.find(project => project.projectId.toString() === projectId)) {
            return false;
        }
        profile.projects.push({ projectId: new mongoose_2.Types.ObjectId(projectId), isFavorite: false });
        await profile.save();
        return true;
    }
    async pullProject(profileId, projectId) {
        const profile = await this.profileModel.findOne({
            _id: profileId,
            isDeleted: false,
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        const idx = profile.projects.findIndex(project => project.projectId.toString() === projectId);
        if (idx === -1) {
            throw new common_1.NotFoundException('Project not found');
        }
        profile.projects.splice(idx, 1);
        await profile.save();
        return true;
    }
    async pushFavorite(profileId, projectId) {
        const profile = await this.profileModel.findOne({
            _id: profileId,
            isDeleted: false,
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        const idx = profile.projects.findIndex(project => project.projectId.toString() === projectId);
        if (idx === -1) {
            throw new common_1.NotFoundException('Project not found');
        }
        if (profile.projects[idx].isFavorite) {
            throw new common_1.BadRequestException('Project is already favorite');
        }
        profile.projects[idx].isFavorite = true;
        const savedProfile = await profile.save();
        return savedProfile;
    }
    async pullFavorite(profileId, projectId) {
        const profile = await this.profileModel.findOne({
            _id: profileId,
            isDeleted: false,
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        const idx = profile.projects.findIndex(project => project.projectId.toString() === projectId);
        if (idx === -1) {
            throw new common_1.NotFoundException('Project not found');
        }
        if (!profile.projects[idx].isFavorite) {
            throw new common_1.BadRequestException('Project is not favorite');
        }
        profile.projects[idx].isFavorite = false;
        const savedProfile = await profile.save();
        return savedProfile;
    }
};
exports.ProfileService = ProfileService;
exports.ProfileService = ProfileService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(profile_schema_1.Profile.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ProfileService);
//# sourceMappingURL=profile.service.js.map