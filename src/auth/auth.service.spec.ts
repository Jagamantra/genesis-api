import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Query } from 'mongoose';
import { AuthService } from './auth.service';
import { User, UserDocument, UserRole } from './schemas/user.schema';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let model: Model<UserDocument>;

  const mockUser: Partial<UserDocument> = {
    _id: 'some-id',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: UserRole.USER,
    isVerified: false,
    mfaCode: '123456',
    mfaCodeExpires: new Date(Date.now() + 1000 * 60),
    save: jest.fn().mockResolvedValue(undefined),
  };

  type MockQueryResult = Partial<UserDocument> | null;

  const createMockQuery = (result: MockQueryResult) => {
    const query = {
      exec: jest.fn().mockResolvedValue(result),
      lean: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      equals: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      orFail: jest.fn().mockReturnThis(),
    } as unknown as Query<MockQueryResult, UserDocument>;
    return query;
  };

  // Create a mock Mongoose Model class
  class MockModel {
    constructor(private readonly data: Partial<User>) {
      Object.assign(this, data);
    }

    save = jest.fn().mockResolvedValue(mockUser);

    static findOne = jest.fn().mockImplementation((query: any) => {
      // For verifyMfa
      if (query?.mfaCode === '123456' && query?.email === mockUser.email) {
        return createMockQuery({
          ...mockUser,
          isVerified: true,
          mfaCode: '123456',
          mfaCodeExpires: new Date(Date.now() + 60000), // expires in 1 minute
        });
      }
      if (query?.email === mockUser.email) {
        return createMockQuery(mockUser);
      }
      return createMockQuery(null);
    });

    static findByIdAndUpdate = jest
      .fn()
      .mockImplementation(() => createMockQuery(mockUser));

    static updateOne = jest.fn().mockImplementation(() => ({
      exec: () => Promise.resolve({ modifiedCount: 1 }),
    }));
  }

  const mockMongooseModel = MockModel as unknown as Model<UserDocument>;

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('test-token'),
  };

  const mockMailService = {
    sendMfaMail: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockMongooseModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    model = module.get<Model<UserDocument>>(getModelToken(User.name));

    // Reset mock implementations
    jest.clearAllMocks();

    // Set up default mock behaviors
    MockModel.findOne = jest.fn().mockImplementation((query) => {
      // For verifyMfa
      if (query?.email && query?.mfaCode && query?.mfaCodeExpires?.$gt) {
        const now = new Date();
        // Return valid user for correct MFA code and future expiration
        if (query.mfaCode === '123456' && query.email === mockUser.email) {
          return createMockQuery({
            ...mockUser,
            mfaCode: '123456',
            mfaCodeExpires: new Date(now.getTime() + 60000), // expires in 1 minute
          });
        }
        // Return null for all other cases (wrong code or expired)
        return createMockQuery(null);
      }
      // For other queries
      if (query?.email === mockUser.email) {
        return createMockQuery(mockUser);
      }
      return createMockQuery(null);
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const findOneSpy = jest
        .spyOn(model, 'findOne')
        .mockImplementation(() => createMockQuery(null));

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);

      const result = await service.register(registerDto);
      expect(result).toEqual({
        codeSent: true,
        message: `Registration successful. MFA code sent to ${registerDto.email}`,
      });
      expect(findOneSpy).toHaveBeenCalledWith({ email: registerDto.email });
    });

    it('should throw if user already exists', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      jest.spyOn(model, 'findOne').mockReturnValue(createMockQuery(mockUser));

      await expect(service.register(registerDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('login', () => {
    it('should generate and send MFA code', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUserWithSave = {
        ...mockUser,
        save: jest.fn().mockResolvedValue(true),
      };

      jest
        .spyOn(model, 'findOne')
        .mockReturnValue(
          createMockQuery(mockUserWithSave) as Query<
            UserDocument | null,
            UserDocument
          >,
        );

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.login(loginDto);
      expect(result).toEqual({
        codeSent: true,
        message: `MFA code sent to ${loginDto.email}`,
      });
      expect(mockMailService.sendMfaMail).toHaveBeenCalled();
    });

    it('should throw if user not found', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      jest
        .spyOn(model, 'findOne')
        .mockImplementation(() => createMockQuery(null));

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw if password is incorrect', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      jest
        .spyOn(model, 'findOne')
        .mockImplementation(() => createMockQuery(mockUser));

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('verifyMfa', () => {
    it('should verify MFA and return token', async () => {
      const verifyMfaDto = {
        email: 'test@example.com',
        mfaCode: '123456',
      };

      const result = await service.verifyMfa(verifyMfaDto);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('role');
      expect(result.accessToken).toBe('test-token');
      expect(result.email).toBe(mockUser.email);
      expect(result.role).toBe(mockUser.role);
    });

    it('should throw if MFA code is incorrect', async () => {
      const verifyMfaDto = {
        email: 'test@example.com',
        mfaCode: 'wrong123',
      };

      await expect(service.verifyMfa(verifyMfaDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw if MFA code has expired', async () => {
      const verifyMfaDto = {
        email: 'test@example.com',
        mfaCode: '123456',
      };

      // Mock findOne for this specific test to return null (simulating expired code)
      jest
        .spyOn(model, 'findOne')
        .mockImplementation(() => createMockQuery(null));

      await expect(service.verifyMfa(verifyMfaDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
