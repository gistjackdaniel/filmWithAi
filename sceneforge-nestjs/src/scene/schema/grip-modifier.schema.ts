import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GripModifierDocument = GripModifier & Document;

@Schema({ _id: false })
export class GripModifier {
  @Prop([{ type: String, trim: true, maxlength: 100 }])
  flags: string[];

  @Prop([{ type: String, trim: true, maxlength: 100 }])
  diffusion: string[];

  @Prop([{ type: String, trim: true, maxlength: 100 }])
  reflectors: string[];

  @Prop([{ type: String, trim: true, maxlength: 100 }])
  colorGels: string[];
}

export const GripModifierSchema = SchemaFactory.createForClass(GripModifier); 