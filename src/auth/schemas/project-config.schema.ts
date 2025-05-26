import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

interface ConfigOption {
  name: string;
  value: string;
}

interface AppVersion {
  id: string;
  name: string;
  value: string;
}

@Schema({ timestamps: true })
export class ProjectConfig {
  @Prop({ required: true })
  appName: string;

  @Prop({ type: [String], required: true })
  appIconPaths: string[];

  @Prop({
    type: String,
    default: null,
    description: 'Set to null to use default logo',
  })
  appLogoUrl: string | null;

  @Prop({
    type: String,
    default: null,
    description: 'Set to null to use default favicon',
  })
  faviconUrl: string | null;

  @Prop({ type: [Object], required: true })
  availableAccentColors: ConfigOption[];

  @Prop({ required: true })
  defaultAccentColorName: string;

  @Prop({ type: [Object], required: true })
  availableBorderRadii: ConfigOption[];

  @Prop({ required: true })
  defaultBorderRadiusName: string;

  @Prop({ type: [Object], required: true })
  availableAppVersions: AppVersion[];

  @Prop({ required: true })
  defaultAppVersionId: string;

  @Prop({ default: true })
  enableApplicationConfig: boolean;

  @Prop({ type: [Object], required: true })
  availableFontSizes: ConfigOption[];

  @Prop({ required: true })
  defaultFontSizeName: string;

  @Prop({ type: [Object], required: true })
  availableScales: ConfigOption[];

  @Prop({ required: true })
  defaultScaleName: string;

  @Prop({ type: [Object], required: true })
  availableInterfaceDensities: ConfigOption[];

  @Prop({ required: true })
  defaultInterfaceDensity: string;

  @Prop({ default: false })
  mockApiMode: boolean;
}

export type ProjectConfigDocument = ProjectConfig & Document;
export const ProjectConfigSchema = SchemaFactory.createForClass(ProjectConfig);
