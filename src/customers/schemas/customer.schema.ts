import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum CustomerStatus {
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  On_Hold = 'on-hold',
  CANCELLED = 'cancelled',
}

export type CustomerDocument = Customer & Document;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (
      _doc: any,
      ret: { _id?: string; __v?: number; id?: string },
    ) => {
      ret.id = ret._id?.toString() || '';
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Customer {
  @ApiProperty({ example: 'Acme Corp' })
  @Prop({ required: true })
  companyName: string;

  @ApiProperty({ example: 'Amsterdam, Netherlands' })
  @Prop({ required: true })
  address: string;

  @ApiProperty({ example: '+31612345678' })
  @Prop({ required: true })
  phoneNumber: string;

  @ApiProperty({ example: 'info@acme.com' })
  @Prop({ required: true })
  email: string;

  @ApiProperty({ example: 'www.acme.com' })
  @Prop({ required: false })
  website: string;

  @ApiProperty({ example: '12345678' })
  @Prop({ required: true })
  kvkNumber: string;

  @ApiProperty({ example: 'BV' })
  @Prop({ required: true })
  legalForm: string;

  @ApiProperty({ example: 'Software Development' })
  @Prop({ required: true })
  mainActivity: string;

  @ApiProperty({ example: 'IT Consulting' })
  @Prop({ type: String, required: false })
  sideActivities: string;

  @ApiProperty({ example: 'John Doe' })
  @Prop({ required: true })
  dga: string;

  @ApiProperty({ example: 50 })
  @Prop({ required: true })
  staffFTE: number;

  @ApiProperty({ example: 1000000 })
  @Prop({ required: true })
  annualTurnover: number;

  @ApiProperty({ example: 500000 })
  @Prop({ required: true })
  grossProfit: number;

  @ApiProperty({ example: 2023 })
  @Prop({ required: true })
  payrollYear: number;

  @ApiProperty({ example: 'Company description' })
  @Prop({ required: false })
  description: string;

  @ApiProperty({ example: '2023-05-26' })
  @Prop({ required: true })
  visitDate: string;

  @ApiProperty({ example: 'Jane Smith' })
  @Prop({ required: true })
  advisor: string;

  @ApiProperty({ example: 'Amsterdam Office' })
  @Prop({ required: true })
  visitLocation: string;

  @ApiProperty({ example: 'Monthly' })
  @Prop({ required: true })
  visitFrequency: string;

  @ApiProperty({ example: 'John Doe - CEO' })
  @Prop({ required: true })
  conversationPartner: string;

  @ApiProperty({ example: 'Meeting notes...' })
  @Prop({ required: false })
  comments: string;

  @ApiProperty({
    enum: CustomerStatus,
    enumName: 'CustomerStatus',
    example: CustomerStatus.IN_PROGRESS,
  })
  @Prop({
    type: String,
    enum: CustomerStatus,
    default: CustomerStatus.IN_PROGRESS,
  })
  status: CustomerStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
