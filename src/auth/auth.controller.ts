import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  HttpStatus,
  HttpCode,
  Res,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { UserDocument, UserRole } from './schemas/user.schema';
import { MockUserProfile } from './config/mock-users.config';
import { ProjectConfig } from './schemas/project-config.schema';
import { Roles } from './decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import {
  LoginDto,
  RegisterDto,
  VerifyMfaDto,
  AuthResponseDto,
  MfaResponseDto,
} from './dto/auth.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  getSchemaPath,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '../common/guards/auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Create a new user account with email and password',
  })
  @ApiBody({
    type: RegisterDto,
    description: 'User registration credentials',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered',
    schema: {
      allOf: [
        { $ref: getSchemaPath(MfaResponseDto) },
        {
          example: {
            codeSent: true,
            message:
              'Registration successful. MFA code sent to user@example.com',
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data provided',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'email must be a valid email address',
            'password must be at least 6 characters long',
          ],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already registered',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'User already exists' },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  async register(@Body() registerDto: RegisterDto): Promise<MfaResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({
    summary: 'Initiate login with email and password',
    description:
      'Start the login process by providing credentials. An MFA code will be sent to the email if credentials are valid.',
  })
  @ApiBody({
    type: LoginDto,
    description: 'User login credentials',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'MFA code sent successfully',
    type: MfaResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials provided',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid credentials' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  async login(@Body() loginDto: LoginDto): Promise<MfaResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('verify-mfa')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({
    summary: 'Verify MFA code and complete login',
    description:
      'Complete the login process by verifying the MFA code sent to email',
  })
  @ApiBody({
    type: VerifyMfaDto,
    description: 'MFA verification details',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired MFA code',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid or expired MFA code' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'email must be a valid email address',
            'mfaCode must be a 6-digit number',
          ],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async verifyMfa(
    @Body() verifyMfaDto: VerifyMfaDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    return this.authService.verifyMfa(verifyMfaDto, response);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user and clear authentication cookie' })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out',
  })
  logout(@Res({ passthrough: true }) response: Response): { message: string } {
    return this.authService.logout(response);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current user details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the current user details',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string' },
        isVerified: { type: 'boolean' },
        displayName: { type: 'string' },
        photoURL: { type: 'string' },
        phoneNumber: { type: 'string', nullable: true },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
  })
  async getUserDetails(
    @Request() req: { user: { sub: string } },
  ): Promise<Omit<UserDocument | MockUserProfile, 'password'>> {
    return this.authService.getUserDetails(req.user.sub);
  }

  @Get('config')
  @Public()
  @ApiOperation({ summary: 'Get project configuration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the project configuration',
    type: ProjectConfig,
  })
  async getProjectConfig(): Promise<ProjectConfig> {
    return this.authService.getProjectConfig();
  }

  @Patch('config/:key')
  @UseGuards(AuthGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a specific project configuration field' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the updated project configuration',
    type: ProjectConfig,
  })
  async updateProjectConfig(
    @Param('key') key: string,
    @Body('value') value: ProjectConfig[keyof ProjectConfig],
  ): Promise<ProjectConfig> {
    const configKey = key as keyof ProjectConfig;
    return this.authService.updateProjectConfig(configKey, value);
  }
}
