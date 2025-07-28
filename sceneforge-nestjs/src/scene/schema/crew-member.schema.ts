import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema()
export class CrewMember {
  @Prop({ type: String, required: true })
  role: string;

  @Prop({ type: String, required: false })
  contact: string;

  @Prop({ type: Types.ObjectId, ref: 'Profile', required: false, default: null })
  profileId?: Types.ObjectId;
}

export const CrewMemberSchema = SchemaFactory.createForClass(CrewMember);