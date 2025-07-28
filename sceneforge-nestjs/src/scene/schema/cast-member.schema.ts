import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema()
export class CastMember {
  @Prop({ type: String, required: true })
  role: string;
  
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'Profile', required: false, default: null })
  profileId?: Types.ObjectId;
}

export const CastMemberSchema = SchemaFactory.createForClass(CastMember);
