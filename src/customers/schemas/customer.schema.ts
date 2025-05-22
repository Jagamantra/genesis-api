import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { AssessmentStatus } from '../enums/assessment-status.enum';

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
  customerName: string;

  @ApiProperty({ example: 'John Doe' })
  @Prop({ required: true })
  contactName: string;

  @ApiProperty({ example: 'Jane Smith' })
  @Prop({ required: true })
  advisorName: string;

  @ApiProperty({ example: 'Initial assessment notes' })
  @Prop({ required: false })
  notes?: string;

  @ApiProperty({
    enum: AssessmentStatus,
    enumName: 'AssessmentStatus',
    example: AssessmentStatus.IN_PROGRESS,
  })
  @Prop({
    type: String,
    enum: AssessmentStatus,
    default: AssessmentStatus.IN_PROGRESS,
  })
  status: AssessmentStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
