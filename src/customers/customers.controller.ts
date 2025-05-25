import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { Customer } from './schemas/customer.schema';
import { UserRole } from '../auth/schemas/user.schema';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
@ApiTags('customers', 'Customer management endpoints')
@ApiBearerAuth('JWT-auth')
@ApiCookieAuth('access_token')
@UseGuards(AuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new customer assessment' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The customer assessment has been successfully created.',
    type: Customer,
  })
  create(@Body() createCustomerDto: CreateCustomerDto): Promise<Customer> {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all customer assessments' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all customer assessments.',
    type: [Customer],
  })
  findAll(): Promise<Customer[]> {
    return this.customersService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a customer assessment by id' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the customer assessment.',
    type: Customer,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer assessment not found.',
  })
  findOne(@Param('id') id: string): Promise<Customer> {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a customer assessment' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The customer assessment has been successfully updated.',
    type: Customer,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer assessment not found.',
  })
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a customer assessment' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The customer assessment has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer assessment not found.',
  })
  async remove(@Param('id') id: string): Promise<void> {
    await this.customersService.remove(id);
  }
}
