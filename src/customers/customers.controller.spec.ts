import { Test, TestingModule } from '@nestjs/testing';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { AssessmentStatus } from './enums/assessment-status.enum';
import { NotFoundException } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { MockAuthGuard } from '../common/testing/mock-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

describe('CustomersController', () => {
  let controller: CustomersController;
  let service: CustomersService;

  const mockCustomer = {
    id: 'some-id',
    customerName: 'Acme Corp',
    contactName: 'John Doe',
    advisorName: 'Jane Smith',
    notes: 'Initial assessment',
    status: AssessmentStatus.IN_PROGRESS,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCustomersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        {
          provide: CustomersService,
          useValue: mockCustomersService,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useClass(MockAuthGuard)
      .compile();

    controller = module.get<CustomersController>(CustomersController);
    service = module.get<CustomersService>(CustomersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createCustomerDto: CreateCustomerDto = {
      customerName: 'Acme Corp',
      contactName: 'John Doe',
      advisorName: 'Jane Smith',
    };

    it('should create a new customer assessment', async () => {
      const createSpy = jest
        .spyOn(service, 'create')
        .mockImplementation(() => Promise.resolve(mockCustomer));

      const result = await controller.create(createCustomerDto);
      expect(result).toBe(mockCustomer);
      expect(createSpy).toHaveBeenCalledWith(createCustomerDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of customer assessments', async () => {
      const findAllSpy = jest
        .spyOn(service, 'findAll')
        .mockImplementation(() => Promise.resolve([mockCustomer]));

      const result = await controller.findAll();
      expect(result).toEqual([mockCustomer]);
      expect(findAllSpy).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single customer assessment', async () => {
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockImplementation(() => Promise.resolve(mockCustomer));

      const result = await controller.findOne('some-id');
      expect(result).toBe(mockCustomer);
      expect(findOneSpy).toHaveBeenCalledWith('some-id');
    });

    it('should throw NotFoundException when customer assessment is not found', async () => {
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockImplementation(() => Promise.reject(new NotFoundException()));

      await expect(controller.findOne('wrong-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(findOneSpy).toHaveBeenCalledWith('wrong-id');
    });
  });

  describe('update', () => {
    const updateCustomerDto: UpdateCustomerDto = {
      customerName: 'Updated Corp',
    };

    it('should update a customer assessment', async () => {
      const updateSpy = jest
        .spyOn(service, 'update')
        .mockImplementation(() =>
          Promise.resolve({ ...mockCustomer, ...updateCustomerDto }),
        );

      const result = await controller.update('some-id', updateCustomerDto);
      expect(result.customerName).toBe(updateCustomerDto.customerName);
      expect(updateSpy).toHaveBeenCalledWith('some-id', updateCustomerDto);
    });
  });

  describe('remove', () => {
    it('should remove a customer assessment', async () => {
      const removeSpy = jest
        .spyOn(service, 'remove')
        .mockImplementation(() => Promise.resolve());

      await controller.remove('some-id');
      expect(removeSpy).toHaveBeenCalledWith('some-id');
    });
  });
});
