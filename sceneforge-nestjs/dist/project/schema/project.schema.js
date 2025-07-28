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
exports.ProjectSchema = exports.Project = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Project = class Project {
    _id;
    ownerId;
    title;
    synopsis;
    story;
    tags;
    isPublic;
    createdAt;
    updatedAt;
    lastViewedAt;
    isDeleted;
    participants;
    scenes;
    genre;
    estimatedDuration;
};
exports.Project = Project;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Profile', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Project.prototype, "ownerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, maxlength: 200 }),
    __metadata("design:type", String)
], Project.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ maxlength: 2000, required: false }),
    __metadata("design:type", String)
], Project.prototype, "synopsis", void 0);
__decorate([
    (0, mongoose_1.Prop)({ maxlength: 10000, required: false }),
    __metadata("design:type", String)
], Project.prototype, "story", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], trim: true, default: [] }),
    __metadata("design:type", Array)
], Project.prototype, "tags", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Project.prototype, "isPublic", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], Project.prototype, "createdAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], Project.prototype, "updatedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], Project.prototype, "lastViewedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Project.prototype, "isDeleted", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [mongoose_2.Types.ObjectId], ref: 'Profile', default: [] }),
    __metadata("design:type", Array)
], Project.prototype, "participants", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [mongoose_2.Types.ObjectId], ref: 'Scene', default: [] }),
    __metadata("design:type", Array)
], Project.prototype, "scenes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], trim: true, default: [] }),
    __metadata("design:type", Array)
], Project.prototype, "genre", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: '90분' }),
    __metadata("design:type", String)
], Project.prototype, "estimatedDuration", void 0);
exports.Project = Project = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Project);
exports.ProjectSchema = mongoose_1.SchemaFactory.createForClass(Project);
//# sourceMappingURL=project.schema.js.map