import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Query } from 'mongoose';
import { AuthService } from './auth.service';
import { User, UserDocument } from './schemas/user.schema';
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
    role: 'user',
    isVerified: false,
  };

  type MockQuery = Query<UserDocument | null, UserDocument>;

  const mockQueryBuilder: Partial<MockQuery> = {
    exec: jest.fn(),
  };

  const mockUserModel = {
    new: jest.fn().mockResolvedValue(mockUser),
    constructor: jest.fn().mockResolvedValue(mockUser),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    exec: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('test-token'),
  };

  const mockMailService = {
    sendMfaMail: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
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

    // Reset mockQueryBuilder exec implementation
    (mockQueryBuilder.exec as jest.Mock).mockReset();
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

      (mockQueryBuilder.exec as jest.Mock).mockResolvedValueOnce(null);

      jest
        .spyOn(model, 'findOne')
        .mockReturnValue(mockQueryBuilder as MockQuery);

      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve('hashedPassword'));

      const saveSpy = jest
        .spyOn(mockUserModel, 'save')
        .mockResolvedValueOnce(mockUser);

      const result = await service.register(registerDto);

      expect(result).toEqual({ message: 'User registered successfully' });
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should throw if user already exists', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      (mockQueryBuilder.exec as jest.Mock).mockResolvedValueOnce(mockUser);

      jest
        .spyOn(model, 'findOne')
        .mockReturnValue(mockQueryBuilder as MockQuery);

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
        save: jest.fn().mockResolvedValueOnce(true),
      };

      (mockQueryBuilder.exec as jest.Mock).mockResolvedValueOnce(
        mockUserWithSave,
      );

      jest
        .spyOn(model, 'findOne')
        .mockReturnValue(mockQueryBuilder as MockQuery);

      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));

      const result = await service.login(loginDto);

      expect(result).toEqual({ message: 'MFA code sent to your email' });
      expect(mockMailService.sendMfaMail).toHaveBeenCalled();
    });
  });

  describe('verifyMfa', () => {
    it('should verify MFA and return token', async () => {
      const verifyMfaDto = {
        email: 'test@example.com',
        mfaCode: '123456',
      };

      const mockUserWithMfa = {
        ...mockUser,
        mfaCode: '123456',
        mfaCodeExpires: new Date(Date.now() + 1000 * 60),
        save: jest.fn().mockResolvedValueOnce(true),
      };

      (mockQueryBuilder.exec as jest.Mock).mockResolvedValueOnce(
        mockUserWithMfa,
      );

      jest
        .spyOn(model, 'findOne')
        .mockReturnValue(mockQueryBuilder as MockQuery);

      const result = await service.verifyMfa(verifyMfaDto);

      expect(result).toHaveProperty('token');
      expect(result.token).toBe('test-token');
    });
  });
});
