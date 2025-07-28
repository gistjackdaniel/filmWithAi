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
exports.SceneSchema = exports.Scene = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const dialogue_schema_1 = require("./dialogue.schema");
const light_setup_schema_1 = require("./light-setup.schema");
const grip_modifier_schema_1 = require("./grip-modifier.schema");
const light_overall_schema_1 = require("./light-overall.schema");
const crew_member_schema_1 = require("./crew-member.schema");
const cast_member_schema_1 = require("./cast-member.schema");
const extra_member_schema_1 = require("./extra-member.schema");
let Scene = class Scene {
    _id;
    projectId;
    title;
    description;
    dialogues;
    weather;
    lighting;
    visualDescription;
    scenePlace;
    sceneDateTime;
    vfxRequired;
    sfxRequired;
    estimatedDuration;
    location;
    timeOfDay;
    crew;
    equipment;
    cast;
    extra;
    specialRequirements;
    order;
    isDeleted;
};
exports.Scene = Scene;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: 'Project',
        required: true,
        index: true
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Scene.prototype, "projectId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    }),
    __metadata("design:type", String)
], Scene.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    }),
    __metadata("design:type", String)
], Scene.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [dialogue_schema_1.DialogueSchema] }),
    __metadata("design:type", Array)
], Scene.prototype, "dialogues", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        default: '',
        trim: true,
        maxlength: 100
    }),
    __metadata("design:type", String)
], Scene.prototype, "weather", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            description: {
                type: String,
                default: '',
                trim: true,
                maxlength: 200
            },
            setup: {
                keyLight: { type: light_setup_schema_1.LightSetupSchema },
                fillLight: { type: light_setup_schema_1.LightSetupSchema },
                backLight: { type: light_setup_schema_1.LightSetupSchema },
                backgroundLight: { type: light_setup_schema_1.LightSetupSchema },
                specialEffects: { type: light_setup_schema_1.LightSetupSchema },
                softLight: { type: light_setup_schema_1.LightSetupSchema },
                gripModifier: { type: grip_modifier_schema_1.GripModifierSchema },
                overall: { type: light_overall_schema_1.LightOverallSchema }
            }
        }
    }),
    __metadata("design:type", Object)
], Scene.prototype, "lighting", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        default: '',
        trim: true,
        maxlength: 500
    }),
    __metadata("design:type", String)
], Scene.prototype, "visualDescription", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        default: '',
        trim: true,
        maxlength: 200
    }),
    __metadata("design:type", String)
], Scene.prototype, "scenePlace", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        default: '',
        trim: true,
        maxlength: 200
    }),
    __metadata("design:type", String)
], Scene.prototype, "sceneDateTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: Boolean,
        default: false
    }),
    __metadata("design:type", Boolean)
], Scene.prototype, "vfxRequired", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: Boolean,
        default: false
    }),
    __metadata("design:type", Boolean)
], Scene.prototype, "sfxRequired", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        default: '5분'
    }),
    __metadata("design:type", String)
], Scene.prototype, "estimatedDuration", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            name: { type: String, default: '', trim: true, maxlength: 200 },
            address: { type: String, default: '', trim: true, maxlength: 500 },
            group_name: { type: String, default: '', trim: true, maxlength: 200 }
        },
        default: null
    }),
    __metadata("design:type", Object)
], Scene.prototype, "location", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['새벽', '아침', '오후', '저녁', '밤', '낮'],
        default: '오후'
    }),
    __metadata("design:type", String)
], Scene.prototype, "timeOfDay", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            direction: {
                director: [crew_member_schema_1.CrewMemberSchema],
                assistantDirector: [crew_member_schema_1.CrewMemberSchema],
                scriptSupervisor: [crew_member_schema_1.CrewMemberSchema],
                continuity: [crew_member_schema_1.CrewMemberSchema]
            },
            production: {
                producer: [crew_member_schema_1.CrewMemberSchema],
                lineProducer: [crew_member_schema_1.CrewMemberSchema],
                productionManager: [crew_member_schema_1.CrewMemberSchema],
                productionAssistant: [crew_member_schema_1.CrewMemberSchema]
            },
            cinematography: {
                cinematographer: [crew_member_schema_1.CrewMemberSchema],
                cameraOperator: [crew_member_schema_1.CrewMemberSchema],
                firstAssistant: [crew_member_schema_1.CrewMemberSchema],
                secondAssistant: [crew_member_schema_1.CrewMemberSchema],
                dollyGrip: [crew_member_schema_1.CrewMemberSchema]
            },
            lighting: {
                gaffer: [crew_member_schema_1.CrewMemberSchema],
                bestBoy: [crew_member_schema_1.CrewMemberSchema],
                electrician: [crew_member_schema_1.CrewMemberSchema],
                generatorOperator: [crew_member_schema_1.CrewMemberSchema]
            },
            sound: {
                soundMixer: [crew_member_schema_1.CrewMemberSchema],
                boomOperator: [crew_member_schema_1.CrewMemberSchema],
                soundAssistant: [crew_member_schema_1.CrewMemberSchema],
                utility: [crew_member_schema_1.CrewMemberSchema]
            },
            art: {
                productionDesigner: [crew_member_schema_1.CrewMemberSchema],
                artDirector: [crew_member_schema_1.CrewMemberSchema],
                setDecorator: [crew_member_schema_1.CrewMemberSchema],
                propMaster: [crew_member_schema_1.CrewMemberSchema],
                makeupArtist: [crew_member_schema_1.CrewMemberSchema],
                costumeDesigner: [crew_member_schema_1.CrewMemberSchema],
                hairStylist: [crew_member_schema_1.CrewMemberSchema]
            }
        }
    }),
    __metadata("design:type", Object)
], Scene.prototype, "crew", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            direction: {
                monitors: [{ type: String, trim: true }],
                communication: [{ type: String, trim: true }],
                scriptBoards: [{ type: String, trim: true }]
            },
            production: {
                scheduling: [{ type: String, trim: true }],
                safety: [{ type: String, trim: true }],
                transportation: [{ type: String, trim: true }]
            },
            cinematography: {
                cameras: [{ type: String, trim: true }],
                lenses: [{ type: String, trim: true }],
                supports: [{ type: String, trim: true }],
                filters: [{ type: String, trim: true }],
                accessories: [{ type: String, trim: true }]
            },
            lighting: {
                keyLights: [{ type: String, trim: true }],
                fillLights: [{ type: String, trim: true }],
                backLights: [{ type: String, trim: true }],
                backgroundLights: [{ type: String, trim: true }],
                specialEffectsLights: [{ type: String, trim: true }],
                softLights: [{ type: String, trim: true }],
                gripModifiers: {
                    flags: [{ type: String, trim: true }],
                    diffusion: [{ type: String, trim: true }],
                    reflectors: [{ type: String, trim: true }],
                    colorGels: [{ type: String, trim: true }]
                },
                power: [{ type: String, trim: true }]
            },
            sound: {
                microphones: [{ type: String, trim: true }],
                recorders: [{ type: String, trim: true }],
                wireless: [{ type: String, trim: true }],
                monitoring: [{ type: String, trim: true }]
            },
            art: {
                setConstruction: [{ type: String, trim: true }],
                props: {
                    characterProps: [{ type: String, trim: true }],
                    setProps: [{ type: String, trim: true }]
                },
                setDressing: [{ type: String, trim: true }],
                costumes: [{ type: String, trim: true }],
                specialEffects: [{ type: String, trim: true }]
            }
        }
    }),
    __metadata("design:type", Object)
], Scene.prototype, "equipment", void 0);
__decorate([
    (0, mongoose_1.Prop)([{ type: cast_member_schema_1.CastMemberSchema }]),
    __metadata("design:type", Array)
], Scene.prototype, "cast", void 0);
__decorate([
    (0, mongoose_1.Prop)([{ type: extra_member_schema_1.ExtraMemberSchema }]),
    __metadata("design:type", Array)
], Scene.prototype, "extra", void 0);
__decorate([
    (0, mongoose_1.Prop)([{ type: String, trim: true }]),
    __metadata("design:type", Array)
], Scene.prototype, "specialRequirements", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Scene.prototype, "order", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: Boolean,
        default: false
    }),
    __metadata("design:type", Boolean)
], Scene.prototype, "isDeleted", void 0);
exports.Scene = Scene = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    })
], Scene);
exports.SceneSchema = mongoose_1.SchemaFactory.createForClass(Scene);
//# sourceMappingURL=scene.schema.js.map