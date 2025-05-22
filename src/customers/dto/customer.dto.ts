import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { AssessmentStatus } from '../enums/assessment-status.enum';

export class CreateCustomerDto {
  @ApiProperty({
    example: 'Acme Corp',
    description: 'Name of the customer company',
    required: true,
  })
  @IsString({ message: 'Customer name must be a string' })
  readonly customerName!: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Name of the primary contact',
    required: true,
  })
  @IsString({ message: 'Contact name must be a string' })
  readonly contactName!: string;

  @ApiProperty({
    example: 'Jane Smith',
    description: 'Name of the assigned advisor',
    required: true,
  })
  @IsString({ message: 'Advisor name must be a string' })
  readonly advisorName!: string;

  @ApiProperty({
    example: 'Initial assessment notes',
    description: 'Additional notes about the assessment',
    required: false,
  })
  @IsString({ message: 'Notes must be a string' })
  @IsOptional()
  readonly notes?: string;

  @ApiProperty({
    enum: AssessmentStatus,
    enumName: 'AssessmentStatus',
    example: AssessmentStatus.IN_PROGRESS,
    description: 'Current status of the assessment',
    required: false,
    default: AssessmentStatus.IN_PROGRESS,
  })
  @IsEnum(AssessmentStatus, { message: 'Invalid status value' })
  @IsOptional()
  readonly status?: AssessmentStatus = AssessmentStatus.IN_PROGRESS;
}

export class UpdateCustomerDto {
  @ApiProperty({
    example: 'Acme Corp Updated',
    description: 'Updated customer company name',
    required: false,
  })
  @IsString({ message: 'Customer name must be a string' })
  @IsOptional()
  readonly customerName?: string;

  @ApiProperty({
    example: 'John Doe Updated',
    description: 'Updated primary contact name',
    required: false,
  })
  @IsString({ message: 'Contact name must be a string' })
  @IsOptional()
  readonly contactName?: string;

  @ApiProperty({
    example: 'Jane Smith Updated',
    description: 'Updated advisor name',
    required: false,
  })
  @IsString({ message: 'Advisor name must be a string' })
  @IsOptional()
  readonly advisorName?: string;

  @ApiProperty({
    example: 'Updated assessment notes',
    description: 'Updated notes about the assessment',
    required: false,
  })
  @IsString({ message: 'Notes must be a string' })
  @IsOptional()
  readonly notes?: string;

  @ApiProperty({
    enum: AssessmentStatus,
    enumName: 'AssessmentStatus',
    example: AssessmentStatus.COMPLETED,
    description: 'Updated status of the assessment',
    required: false,
  })
  @IsEnum(AssessmentStatus, { message: 'Invalid status value' })
  @IsOptional()
  readonly status?: AssessmentStatus;
}
