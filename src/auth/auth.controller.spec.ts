import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    verifyMfa: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const expectedResult = {
        codeSent: true,
        message: 'User registered successfully',
      };

      const registerSpy = jest
        .spyOn(service, 'register')
        .mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);
      expect(result).toBe(expectedResult);
      expect(registerSpy).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should initiate login process', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const expectedResult = {
        message: 'MFA code sent to your email',
        codeSent: true,
      };

      const loginSpy = jest
        .spyOn(service, 'login')
        .mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);
      expect(result).toBe(expectedResult);
      expect(loginSpy).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('verifyMfa', () => {
    it('should verify MFA and return token', async () => {
      const verifyMfaDto = {
        email: 'test@example.com',
        mfaCode: '123456',
      };

      const expectedResult = {
        accessToken: 'jwt-token',
        email: 'test@example.com',
        role: 'user',
        expiresIn: 3600,
      };

      const verifyMfaSpy = jest
        .spyOn(service, 'verifyMfa')
        .mockResolvedValue(expectedResult);

      const result = await controller.verifyMfa(verifyMfaDto);
      expect(result).toBe(expectedResult);
      expect(verifyMfaSpy).toHaveBeenCalledWith(verifyMfaDto);
    });
  });
});
