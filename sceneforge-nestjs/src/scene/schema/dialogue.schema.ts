import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DialogueDocument = Dialogue & Document;

@Schema({ _id: false })
export class Dialogue {
  @Prop({ 
    type: String, 
    required: true, 
    trim: true, 
    maxlength: 100 
  })
  character: string;

  @Prop({ 
    type: String, 
    required: true, 
    trim: true, 
    maxlength: 1000 
  })
  text: string;
}

export const DialogueSchema = SchemaFactory.createForClass(Dialogue); 