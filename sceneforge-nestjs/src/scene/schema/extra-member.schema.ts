import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class ExtraMember {
  @Prop({ type: String, required: true })
  role: string;

  @Prop({ type: Number, required: true })
  number: number;
}

export const ExtraMemberSchema = SchemaFactory.createForClass(ExtraMember);