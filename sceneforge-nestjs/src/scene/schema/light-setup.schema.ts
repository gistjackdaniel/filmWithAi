import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface LightSetup {
  type: string;
  equipment: string;
  intensity: string;
}

@Schema({ _id: false })
export class LightSetupClass {
  @Prop({ 
    type: String, 
    default: '', 
    trim: true, 
    maxlength: 100 
  })
  type: string;

  @Prop({ 
    type: String, 
    default: '', 
    trim: true, 
    maxlength: 100 
  })
  equipment: string;

  @Prop({ 
    type: String, 
    default: '', 
    trim: true, 
    maxlength: 100 
  })
  intensity: string;
}

export type LightSetupDocument = LightSetup & Document;
export const LightSetupSchema = SchemaFactory.createForClass(LightSetupClass); 