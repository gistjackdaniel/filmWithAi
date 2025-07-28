import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Dialogue, DialogueSchema } from './dialogue.schema';
import { LightSetup, LightSetupSchema } from './light-setup.schema';
import { GripModifier, GripModifierSchema } from './grip-modifier.schema';
import { LightOverall, LightOverallSchema } from './light-overall.schema';
import { CrewMember, CrewMemberSchema } from './crew-member.schema';
import { CastMember, CastMemberSchema } from './cast-member.schema';
import { ExtraMember, ExtraMemberSchema } from './extra-member.schema';

export type SceneDocument = Scene & Document;

@Schema({ 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})
export class Scene {
  _id: Types.ObjectId;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'Project', 
    required: true, 
    index: true 
  })
  projectId: Types.ObjectId;

  @Prop({ 
    type: String, 
    required: true, 
    trim: true, 
    maxlength: 200 
  })
  title: string;

  @Prop({ 
    type: String, 
    required: true, 
    trim: true, 
    maxlength: 1000 
  })
  description: string;

  @Prop({ type: [DialogueSchema] })
  dialogues: Dialogue[];

  @Prop({ 
    type: String, 
    default: '', 
    trim: true, 
    maxlength: 100 
  })
  weather: string;

  @Prop({
    type: {
      description: {
        type: String,
        default: '',
        trim: true,
        maxlength: 200
      },
      setup: {
        keyLight: { type: LightSetupSchema },
        fillLight: { type: LightSetupSchema },
        backLight: { type: LightSetupSchema },
        backgroundLight: { type: LightSetupSchema },
        specialEffects: { type: LightSetupSchema },
        softLight: { type: LightSetupSchema },
        gripModifier: { type: GripModifierSchema },
        overall: { type: LightOverallSchema }
      }
    }
  })
  lighting: {
    description: string;
    setup: {
      keyLight: LightSetup;
      fillLight: LightSetup;
      backLight: LightSetup;
      backgroundLight: LightSetup;
      specialEffects: LightSetup;
      softLight: LightSetup;
      gripModifier: GripModifier;
      overall: LightOverall;
    };
  };

  @Prop({ 
    type: String, 
    default: '', 
    trim: true, 
    maxlength: 500 
  })
  visualDescription: string;

  @Prop({ 
    type: String, 
    default: '', 
    trim: true, 
    maxlength: 200 
  })
  scenePlace: string;

  @Prop({ 
    type: String, 
    default: '', 
    trim: true, 
    maxlength: 200 
  })
  sceneDateTime: string;

  @Prop({ 
    type: Boolean, 
    default: false 
  })
  vfxRequired: boolean;

  @Prop({ 
    type: Boolean, 
    default: false 
  })
  sfxRequired: boolean;

  @Prop({ 
    type: String, 
    default: '5분' 
  })
  estimatedDuration: string;

  @Prop({
    type: {
      name: { type: String, default: '', trim: true, maxlength: 200 },
      address: { type: String, default: '', trim: true, maxlength: 500 },
      group_name: { type: String, default: '', trim: true, maxlength: 200 }
    },
    default: null
  })
  location: {
    name: string;
    address: string;
    group_name: string;
  };

  @Prop({ 
    type: String, 
    enum: ['새벽', '아침', '오후', '저녁', '밤', '낮'], 
    default: '오후' 
  })
  timeOfDay: string;

    @Prop({
    type: {
      direction: {
        director: [CrewMemberSchema],
        assistantDirector: [CrewMemberSchema],
        scriptSupervisor: [CrewMemberSchema],
        continuity: [CrewMemberSchema]
      },
      production: {
        producer: [CrewMemberSchema],
        lineProducer: [CrewMemberSchema],
        productionManager: [CrewMemberSchema],
        productionAssistant: [CrewMemberSchema]
      },
      cinematography: {
        cinematographer: [CrewMemberSchema],
        cameraOperator: [CrewMemberSchema],
        firstAssistant: [CrewMemberSchema],
        secondAssistant: [CrewMemberSchema],
        dollyGrip: [CrewMemberSchema]
      },
      lighting: {
        gaffer: [CrewMemberSchema],
        bestBoy: [CrewMemberSchema],
        electrician: [CrewMemberSchema],
        generatorOperator: [CrewMemberSchema]
      },
      sound: {
        soundMixer: [CrewMemberSchema],
        boomOperator: [CrewMemberSchema],
        soundAssistant: [CrewMemberSchema],
        utility: [CrewMemberSchema]
      },
      art: {
        productionDesigner: [CrewMemberSchema],
        artDirector: [CrewMemberSchema],
        setDecorator: [CrewMemberSchema],
        propMaster: [CrewMemberSchema],
        makeupArtist: [CrewMemberSchema],
        costumeDesigner: [CrewMemberSchema],
        hairStylist: [CrewMemberSchema]
      }
    }
  })
  crew: {
    direction: {
      director: CrewMember[];
      assistantDirector: CrewMember[];
      scriptSupervisor: CrewMember[];
      continuity: CrewMember[];
    };
    production: {
      producer: CrewMember[];
      lineProducer: CrewMember[];
      productionManager: CrewMember[];
      productionAssistant: CrewMember[];
    };
    cinematography: {
      cinematographer: CrewMember[];
      cameraOperator: CrewMember[];
      firstAssistant: CrewMember[];
      secondAssistant: CrewMember[];
      dollyGrip: CrewMember[];
    };
    lighting: {
      gaffer: CrewMember[];
      bestBoy: CrewMember[];
      electrician: CrewMember[];
      generatorOperator: CrewMember[];
    };
    sound: {
      soundMixer: CrewMember[];
      boomOperator: CrewMember[];
      soundAssistant: CrewMember[];
      utility: CrewMember[];
    };
    art: {
      productionDesigner: CrewMember[];
      artDirector: CrewMember[];
      setDecorator: CrewMember[];
      propMaster: CrewMember[];
      makeupArtist: CrewMember[];
      costumeDesigner: CrewMember[];
      hairStylist: CrewMember[];
    };
  };

  @Prop({
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
  })
  equipment: {
    direction: {
      monitors: string[];
      communication: string[];
      scriptBoards: string[];
    };
    production: {
      scheduling: string[];
      safety: string[];
      transportation: string[];
    };
    cinematography: {
      cameras: string[];
      lenses: string[];
      supports: string[];
      filters: string[];
      accessories: string[];
    };
    lighting: {
      keyLights: string[];
      fillLights: string[];
      backLights: string[];
      backgroundLights: string[];
      specialEffectsLights: string[];
      softLights: string[];
      gripModifiers: {
        flags: string[];
        diffusion: string[];
        reflectors: string[];
        colorGels: string[];
      };
      power: string[];
    };
    sound: {
      microphones: string[];
      recorders: string[];
      wireless: string[];
      monitoring: string[];
    };
    art: {
      setConstruction: string[];
      props: {
        characterProps: string[];
        setProps: string[];
      };
      setDressing: string[];
      costumes: string[];
      specialEffects: string[];
    };
  };

  @Prop([{ type: CastMemberSchema }])
  cast: CastMember[];
  
  @Prop([{ type: ExtraMemberSchema }])
  extra: ExtraMember[];

  @Prop([{ type: String, trim: true }])
  specialRequirements: string[];

  @Prop({ type: Number, default: 0 })
  order: number;

  @Prop({
    type: Boolean,
    default: false
  })
  isDeleted: boolean;
}

export const SceneSchema = SchemaFactory.createForClass(Scene);