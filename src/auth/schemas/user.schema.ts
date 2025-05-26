import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export type ThemeSettings = {
  theme?: 'light' | 'dark' | 'system';
  accentColor?: string;
  borderRadius?: string;
  appVersion?: string;
  appName?: string;
  appIconPaths: string[];
  appLogoUrl?: string | null;
  fontSize?: string;
  appScale?: string;
  interfaceDensity?: 'compact' | 'comfortable' | 'spacious';
};

@Schema({ timestamps: true })
export class User {
  @Prop({ type: Types.ObjectId, auto: true })
  _id?: Types.ObjectId;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    type: String,
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Prop({ type: String, required: false })
  displayName: string;

  @Prop({ type: String, required: false })
  photoURL: string;

  @Prop({ type: String, required: false })
  phoneNumber: string;

  @Prop({ type: Boolean, default: true })
  receiveNotifications: boolean;

  @Prop({ type: Object, default: {} })
  preferences: Partial<ThemeSettings>;

  @Prop()
  mfaCode?: string;

  @Prop()
  mfaCodeExpires?: Date;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  accessToken?: string;

  @Prop()
  accessTokenExpires?: Date;

  @Prop({ default: false })
  isTokenRevoked?: boolean;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
