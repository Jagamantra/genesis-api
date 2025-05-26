import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
} from 'class-validator';
import { CustomerStatus } from '../schemas/customer.schema';

export class CreateCustomerDto {
  @ApiProperty({
    example: 'Acme Corp',
    description: 'Name of the customer company',
    required: true,
  })
  @IsString({ message: 'Company name must be a string' })
  @IsNotEmpty()
  readonly companyName!: string;

  @ApiProperty({
    example: 'Amsterdam, Netherlands',
    description: 'Customer company address',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  readonly address!: string;

  @ApiProperty({
    example: '+31612345678',
    description: 'Phone number of the customer',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  readonly phoneNumber!: string;

  @ApiProperty({
    example: 'info@acme.com',
    description: 'Email of the customer',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  readonly email!: string;

  @ApiProperty({
    example: 'www.acme.com',
    description: 'Website URL of the customer',
    required: false,
  })
  @IsString()
  @IsOptional()
  readonly website?: string;

  @ApiProperty({
    example: '12345678',
    description: 'KVK (chamber of commerce) number',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  readonly kvkNumber!: string;

  @ApiProperty({
    example: 'BV',
    description: 'Legal form of the company',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  readonly legalForm!: string;

  @ApiProperty({
    example: 'Software Development',
    description: 'Main activity of the company',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  readonly mainActivity!: string;

  @ApiProperty({
    example: 'IT Consulting',
    description: 'Side activities of the company',
    required: false,
  })
  @IsString()
  @IsOptional()
  readonly sideActivities?: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Name of the DGA (director)',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  readonly dga!: string;

  @ApiProperty({
    example: 50,
    description: 'Staff full-time equivalent (FTE)',
    required: true,
  })
  @IsNumber()
  readonly staffFTE!: number;

  @ApiProperty({
    example: 1000000,
    description: 'Annual turnover amount',
    required: true,
  })
  @IsNumber()
  readonly annualTurnover!: number;

  @ApiProperty({
    example: 500000,
    description: 'Gross profit amount',
    required: true,
  })
  @IsNumber()
  readonly grossProfit!: number;

  @ApiProperty({
    example: 2023,
    description: 'Payroll year',
    required: true,
  })
  @IsNumber()
  readonly payrollYear!: number;

  @ApiProperty({
    example: 'Company description here',
    description: 'Description of the company',
    required: false,
  })
  @IsString()
  @IsOptional()
  readonly description?: string;

  @ApiProperty({
    example: '2023-05-26',
    description: 'Date of the customer visit',
    required: true,
  })
  @IsISO8601()
  readonly visitDate!: string;

  @ApiProperty({
    example: 'Jane Smith',
    description: 'Name of the assigned advisor',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  readonly advisor!: string;

  @ApiProperty({
    example: 'Amsterdam Office',
    description: 'Location of the visit',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  readonly visitLocation!: string;

  @ApiProperty({
    example: 'Monthly',
    description: 'Frequency of the visits',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  readonly visitFrequency!: string;

  @ApiProperty({
    example: 'John Doe - CEO',
    description: 'Conversation partner at the visit',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  readonly conversationPartner!: string;

  @ApiProperty({
    example: 'Meeting notes...',
    description: 'Additional comments',
    required: false,
  })
  @IsString()
  @IsOptional()
  readonly comments?: string;

  @ApiProperty({
    enum: CustomerStatus,
    enumName: 'CustomerStatus',
    example: CustomerStatus.IN_PROGRESS,
    description: 'Current status of the customer',
    required: false,
    default: CustomerStatus.IN_PROGRESS,
  })
  @IsEnum(CustomerStatus)
  @IsOptional()
  readonly status?: CustomerStatus = CustomerStatus.IN_PROGRESS;
}

export class UpdateCustomerDto {
  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  kvkNumber?: string;

  @IsString()
  @IsOptional()
  legalForm?: string;

  @IsString()
  @IsOptional()
  mainActivity?: string;

  @IsString()
  @IsOptional()
  sideActivities?: string;

  @IsString()
  @IsOptional()
  dga?: string;

  @IsNumber()
  @IsOptional()
  staffFTE?: number;

  @IsNumber()
  @IsOptional()
  annualTurnover?: number;

  @IsNumber()
  @IsOptional()
  grossProfit?: number;

  @IsNumber()
  @IsOptional()
  payrollYear?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  visitDate?: string;

  @IsString()
  @IsOptional()
  advisor?: string;

  @IsString()
  @IsOptional()
  visitLocation?: string;

  @IsString()
  @IsOptional()
  visitFrequency?: string;

  @IsString()
  @IsOptional()
  conversationPartner?: string;

  @IsString()
  @IsOptional()
  comments?: string;

  @IsEnum(CustomerStatus)
  @IsOptional()
  status?: CustomerStatus;
}
