import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LightOverallDocument = LightOverall & Document;

@Schema({ _id: false })
export class LightOverall {
  @Prop({ 
    type: String, 
    default: '', 
    trim: true, 
    maxlength: 100 
  })
  colorTemperature: string;

  @Prop({ 
    type: String, 
    default: '', 
    trim: true, 
    maxlength: 100 
  })
  mood: string;
}

export const LightOverallSchema = SchemaFactory.createForClass(LightOverall); 