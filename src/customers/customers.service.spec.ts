import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Query } from 'mongoose';
import { CustomersService } from './customers.service';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { CreateCustomerDto } from './dto/customer.dto';
import { NotFoundException } from '@nestjs/common';
import { AssessmentStatus } from './enums/assessment-status.enum';

describe('CustomersService', () => {
  let service: CustomersService;
  let model: Model<CustomerDocument>;

  const mockCustomer = {
    _id: 'some-id',
    customerName: 'Acme Corp',
    contactName: 'John Doe',
    advisorName: 'Jane Smith',
    notes: 'Initial assessment',
    status: AssessmentStatus.IN_PROGRESS,
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0,
  };

  type ModelFactory = (dto: CreateCustomerDto) => Partial<CustomerDocument>;

  const mockModelFactory: ModelFactory = (dto) => ({
    ...dto,
    save: jest.fn().mockResolvedValue(mockCustomer),
  });

  const MockModel: jest.Mocked<Model<CustomerDocument>> = jest
    .fn()
    .mockImplementation(mockModelFactory) as any;

  MockModel.find = jest.fn();
  MockModel.findById = jest.fn();
  MockModel.findByIdAndUpdate = jest.fn();
  MockModel.findByIdAndDelete = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: getModelToken(Customer.name),
          useValue: MockModel,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    model = module.get<Model<CustomerDocument>>(getModelToken(Customer.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new customer assessment', async () => {
      const createCustomerDto: CreateCustomerDto = {
        customerName: 'Acme Corp',
        contactName: 'John Doe',
        advisorName: 'Jane Smith',
      };

      const result = await service.create(createCustomerDto);
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('findAll', () => {
    it('should return an array of customer assessments', async () => {
      jest.spyOn(model, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce([mockCustomer]),
      } as unknown as Query<CustomerDocument[], CustomerDocument>);

      const customers = await service.findAll();
      expect(customers).toEqual([mockCustomer]);
    });
  });

  describe('findOne', () => {
    it('should return a single customer assessment', async () => {
      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(mockCustomer),
      } as unknown as Query<CustomerDocument | null, CustomerDocument>);

      const customer = await service.findOne('some-id');
      expect(customer).toEqual(mockCustomer);
    });

    it('should throw an error if customer assessment is not found', async () => {
      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(null),
      } as unknown as Query<CustomerDocument | null, CustomerDocument>);

      await expect(service.findOne('wrong-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a customer assessment', async () => {
      const updateCustomerDto = {
        customerName: 'Updated Corp',
      };

      const updatedCustomer = {
        ...mockCustomer,
        ...updateCustomerDto,
      };

      jest.spyOn(model, 'findByIdAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(updatedCustomer),
      } as unknown as Query<CustomerDocument | null, CustomerDocument>);

      const result = await service.update('some-id', updateCustomerDto);
      expect(result.customerName).toBe(updateCustomerDto.customerName);
    });

    it('should throw an error if customer assessment to update is not found', async () => {
      jest.spyOn(model, 'findByIdAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(null),
      } as unknown as Query<CustomerDocument | null, CustomerDocument>);

      await expect(service.update('wrong-id', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a customer assessment', async () => {
      jest.spyOn(model, 'findByIdAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(mockCustomer),
      } as unknown as Query<CustomerDocument | null, CustomerDocument>);

      const removeSpy = jest.spyOn(model, 'findByIdAndDelete');
      await service.remove('some-id');
      expect(removeSpy).toHaveBeenCalledWith('some-id');
    });

    it('should throw an error if customer assessment to remove is not found', async () => {
      jest.spyOn(model, 'findByIdAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(null),
      } as unknown as Query<CustomerDocument | null, CustomerDocument>);

      await expect(service.remove('wrong-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
