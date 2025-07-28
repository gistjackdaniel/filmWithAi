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
exports.CutSchema = exports.Cut = exports.CameraSetup = exports.SpecialRequirements = exports.Safety = exports.SpecialLighting = exports.SpecialEffects = exports.SpecialCinematography = exports.Subject = exports.CameraSettings = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let CameraSettings = class CameraSettings {
    aperture;
    shutterSpeed;
    iso;
};
exports.CameraSettings = CameraSettings;
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: '', trim: true }),
    __metadata("design:type", String)
], CameraSettings.prototype, "aperture", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: '', trim: true }),
    __metadata("design:type", String)
], CameraSettings.prototype, "shutterSpeed", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: '', trim: true }),
    __metadata("design:type", String)
], CameraSettings.prototype, "iso", void 0);
exports.CameraSettings = CameraSettings = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], CameraSettings);
let Subject = class Subject {
    name;
    type;
    position;
    action;
    emotion;
    description;
};
exports.Subject = Subject;
__decorate([
    (0, mongoose_1.Prop)({ type: String, trim: true }),
    __metadata("design:type", String)
], Subject.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['character', 'object', 'animal', 'background'],
        default: 'character'
    }),
    __metadata("design:type", String)
], Subject.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: '', trim: true, maxlength: 200 }),
    __metadata("design:type", String)
], Subject.prototype, "position", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, trim: true, maxlength: 200 }),
    __metadata("design:type", String)
], Subject.prototype, "action", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, trim: true, maxlength: 100 }),
    __metadata("design:type", String)
], Subject.prototype, "emotion", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, trim: true, maxlength: 300 }),
    __metadata("design:type", String)
], Subject.prototype, "description", void 0);
exports.Subject = Subject = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], Subject);
let SpecialCinematography = class SpecialCinematography {
    drone;
    crane;
    jib;
    underwater;
    aerial;
};
exports.SpecialCinematography = SpecialCinematography;
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], SpecialCinematography.prototype, "drone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], SpecialCinematography.prototype, "crane", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], SpecialCinematography.prototype, "jib", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], SpecialCinematography.prototype, "underwater", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], SpecialCinematography.prototype, "aerial", void 0);
exports.SpecialCinematography = SpecialCinematography = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], SpecialCinematography);
let SpecialEffects = class SpecialEffects {
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
};
exports.SpecialEffects = SpecialEffects;
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], SpecialEffects.prototype, "vfx", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], SpecialEffects.prototype, "pyrotechnics", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], SpecialEffects.prototype, "smoke", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], SpecialEffects.prototype, "fog", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], SpecialEffects.prototype, "wind", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], SpecialEffects.prototype, "rain", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], SpecialEffects.prototype, "snow", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], SpecialEffects.prototype, "fire", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], SpecialEffects.prototype, "explosion", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], SpecialEffects.prototype, "stunt", void 0);
exports.SpecialEffects = SpecialEffects = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], SpecialEffects);
let SpecialLighting = class SpecialLighting {
    laser;
    strobe;
    blackLight;
    uvLight;
    movingLight;
    colorChanger;
};
exports.SpecialLighting = SpecialLighting;
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], SpecialLighting.prototype, "laser", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], SpecialLighting.prototype, "strobe", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], SpecialLighting.prototype, "blackLight", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], SpecialLighting.prototype, "uvLight", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], SpecialLighting.prototype, "movingLight", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], SpecialLighting.prototype, "colorChanger", void 0);
exports.SpecialLighting = SpecialLighting = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], SpecialLighting);
let Safety = class Safety {
    requiresMedic;
    requiresFireSafety;
    requiresSafetyOfficer;
};
exports.Safety = Safety;
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], Safety.prototype, "requiresMedic", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], Safety.prototype, "requiresFireSafety", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], Safety.prototype, "requiresSafetyOfficer", void 0);
exports.Safety = Safety = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], Safety);
let SpecialRequirements = class SpecialRequirements {
    specialCinematography;
    specialEffects;
    specialLighting;
    safety;
};
exports.SpecialRequirements = SpecialRequirements;
__decorate([
    (0, mongoose_1.Prop)({ type: SpecialCinematography, default: () => ({}) }),
    __metadata("design:type", SpecialCinematography)
], SpecialRequirements.prototype, "specialCinematography", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: SpecialEffects, default: () => ({}) }),
    __metadata("design:type", SpecialEffects)
], SpecialRequirements.prototype, "specialEffects", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: SpecialLighting, default: () => ({}) }),
    __metadata("design:type", SpecialLighting)
], SpecialRequirements.prototype, "specialLighting", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Safety, default: () => ({}) }),
    __metadata("design:type", Safety)
], SpecialRequirements.prototype, "safety", void 0);
exports.SpecialRequirements = SpecialRequirements = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], SpecialRequirements);
let CameraSetup = class CameraSetup {
    shotSize;
    angleDirection;
    cameraMovement;
    lensSpecs;
    cameraSettings;
};
exports.CameraSetup = CameraSetup;
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: [
            'EWS', 'VWS', 'WS', 'FS', 'LS', 'MLS', 'MS', 'MCS', 'CU', 'MCU', 'BCU', 'ECU', 'TCU',
            'OTS', 'POV', 'TS', 'GS', 'AS', 'PS', 'BS'
        ],
        default: 'MS'
    }),
    __metadata("design:type", String)
], CameraSetup.prototype, "shotSize", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: [
            'Eye-level', 'High', 'Low', 'Dutch', 'Bird_eye', 'Worm_eye', 'Canted', 'Oblique',
            'Aerial', 'Ground', 'Overhead', 'Under', 'Side', 'Front', 'Back', 'Three_quarter',
            'Profile', 'Reverse', 'POV', 'Subjective'
        ],
        default: 'Eye-level'
    }),
    __metadata("design:type", String)
], CameraSetup.prototype, "angleDirection", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: [
            'Static', 'Pan', 'Tilt', 'Dolly', 'Zoom', 'Handheld', 'Tracking', 'Crane', 'Steadicam',
            'Gimbal', 'Drone', 'Jib', 'Slider', 'Dolly_zoom', 'Arc', 'Circle', 'Spiral', 'Vertigo',
            'Whip_pan', 'Crash_zoom', 'Push_in', 'Pull_out', 'Follow', 'Lead', 'Reveal', 'Conceal',
            'Parallax', 'Time_lapse', 'Slow_motion', 'Fast_motion', 'Bullet_time', 'Matrix_style',
            '360_degree', 'VR_style'
        ],
        default: 'Static'
    }),
    __metadata("design:type", String)
], CameraSetup.prototype, "cameraMovement", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: '', trim: true, maxlength: 200 }),
    __metadata("design:type", String)
], CameraSetup.prototype, "lensSpecs", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: CameraSettings, default: () => ({}) }),
    __metadata("design:type", CameraSettings)
], CameraSetup.prototype, "cameraSettings", void 0);
exports.CameraSetup = CameraSetup = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], CameraSetup);
let Cut = class Cut extends mongoose_2.Document {
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
    isDeleted;
};
exports.Cut = Cut;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Scene', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Cut.prototype, "sceneId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Project', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Cut.prototype, "projectId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true, min: 1 }),
    __metadata("design:type", Number)
], Cut.prototype, "order", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, trim: true, maxlength: 200 }),
    __metadata("design:type", String)
], Cut.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, trim: true, maxlength: 1000 }),
    __metadata("design:type", String)
], Cut.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: CameraSetup, default: () => ({}) }),
    __metadata("design:type", CameraSetup)
], Cut.prototype, "cameraSetup", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: '', trim: true, maxlength: 500 }),
    __metadata("design:type", String)
], Cut.prototype, "vfxEffects", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: '', trim: true, maxlength: 500 }),
    __metadata("design:type", String)
], Cut.prototype, "soundEffects", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: '', trim: true, maxlength: 1000 }),
    __metadata("design:type", String)
], Cut.prototype, "directorNotes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: '', trim: true, maxlength: 200 }),
    __metadata("design:type", String)
], Cut.prototype, "dialogue", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: '', trim: true, maxlength: 200 }),
    __metadata("design:type", String)
], Cut.prototype, "narration", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Subject], default: [] }),
    __metadata("design:type", Array)
], Cut.prototype, "subjectMovement", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['live_action', 'ai_generated'],
        default: 'live_action'
    }),
    __metadata("design:type", String)
], Cut.prototype, "productionMethod", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: '', trim: true, maxlength: 500 }),
    __metadata("design:type", String)
], Cut.prototype, "productionMethodReason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 5, min: 1, max: 300 }),
    __metadata("design:type", Number)
], Cut.prototype, "estimatedDuration", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: SpecialRequirements, default: () => ({}) }),
    __metadata("design:type", SpecialRequirements)
], Cut.prototype, "specialRequirements", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null, trim: true }),
    __metadata("design:type", String)
], Cut.prototype, "imageUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], Cut.prototype, "isDeleted", void 0);
exports.Cut = Cut = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Cut);
exports.CutSchema = mongoose_1.SchemaFactory.createForClass(Cut);
//# sourceMappingURL=cut.schema.js.map