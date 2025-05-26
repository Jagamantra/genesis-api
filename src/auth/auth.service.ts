import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { mockUsers, MockUserProfile } from './config/mock-users.config';
import { User, UserDocument, UserRole } from './schemas/user.schema';
import {
  ProjectConfig,
  ProjectConfigDocument,
} from './schemas/project-config.schema';
import {
  LoginDto,
  RegisterDto,
  VerifyMfaDto,
  MfaResponseDto,
  AuthResponseDto,
} from './dto/auth.dto';
import { MailService } from '../mail/mail.service';
import { SendMfaEmailDto } from '../mail/dto/send-mfa-mail.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ProjectConfig.name)
    private projectConfigModel: Model<ProjectConfigDocument>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {
    // Call ensureDefaultConfig but don't block constructor
    void this.ensureDefaultConfig();
  }

  async register(registerDto: RegisterDto): Promise<MfaResponseDto> {
    const { email, password } = registerDto;

    // Check if user exists
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate MFA code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const mfaCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = new this.userModel({
      email,
      password: hashedPassword,
      mfaCode: code,
      mfaCodeExpires,
      role: UserRole.USER,
      isVerified: false,
    });
    await user.save();

    // Send MFA code
    const emailDto: SendMfaEmailDto = {
      to: email,
      code,
    };
    await this.mailService.sendMfaMail(emailDto);

    return {
      codeSent: true,
      message: `Registration successful. MFA code sent to ${email}`,
    };
  }

  private isMockUser(email: string): MockUserProfile | undefined {
    return mockUsers.find((user) => user.email === email);
  }

  async login(loginDto: LoginDto): Promise<MfaResponseDto> {
    const { email, password } = loginDto;

    // Check if it's a mock user
    const mockUser = this.isMockUser(email);
    if (mockUser) {
      if (password !== mockUser.password) {
        throw new UnauthorizedException('Invalid credentials');
      }
      return {
        codeSent: true,
        message: `MFA code sent to ${email}`,
        mockMfaCode: '123456', // Only in development/testing
      };
    }

    // Regular user flow
    const user = await this.userModel.findOne({ email }).lean().exec();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate MFA code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const mfaCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with MFA code
    await this.userModel
      .updateOne(
        { _id: user._id },
        {
          mfaCode: code,
          mfaCodeExpires,
        },
      )
      .exec();

    // Send MFA code
    const emailDto: SendMfaEmailDto = {
      to: email,
      code,
    };
    await this.mailService.sendMfaMail(emailDto);

    return {
      codeSent: true,
      message: `MFA code sent to ${email}`,
    };
  }

  async verifyMfa(
    verifyMfaDto: VerifyMfaDto,
    response: Response,
  ): Promise<AuthResponseDto> {
    const { email, mfaCode } = verifyMfaDto;

    // Check if it's a mock user
    const mockUser = this.isMockUser(email);
    if (mockUser) {
      if (mfaCode !== '123456') {
        throw new UnauthorizedException('Invalid MFA code');
      }

      const expiresIn = 3600;
      const payload = {
        sub: mockUser._id,
        email: mockUser.email,
        role: mockUser.role,
        isMockUser: true,
      };

      const accessToken = this.jwtService.sign(payload, { expiresIn });

      // Set cookie in response
      response.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: expiresIn * 1000, // convert to milliseconds
      });

      return {
        accessToken,
        email: mockUser.email,
        role: mockUser.role,
        expiresIn,
      };
    }

    // Regular user flow
    const user = await this.userModel
      .findOne({
        email,
        mfaCode,
        mfaCodeExpires: { $gt: new Date() },
      })
      .exec();

    if (!user) {
      throw new UnauthorizedException('Invalid or expired MFA code');
    }

    // Clear MFA code and mark as verified
    await this.userModel.updateOne(
      { _id: user._id },
      {
        $unset: { mfaCode: 1, mfaCodeExpires: 1 },
        $set: { isVerified: true },
      },
    );

    // Generate access token
    const expiresIn = 3600; // 1 hour in seconds
    const accessTokenExpires = new Date(Date.now() + expiresIn * 1000);
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn });

    // Set cookie in response
    response.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: expiresIn * 1000,
    });

    // Store token information
    await this.userModel
      .updateOne(
        { _id: user._id },
        {
          $set: {
            accessToken,
            accessTokenExpires,
            isTokenRevoked: false,
          },
        },
      )
      .exec();

    return {
      accessToken,
      email: user.email,
      role: user.role,
      expiresIn,
    };
  }

  async validateUser(
    email: string,
  ): Promise<UserDocument | null | MockUserProfile> {
    // Check if it's a mock user
    const mockUser = this.isMockUser(email);
    if (mockUser) {
      return mockUser;
    }

    // Regular user validation
    const user = await this.userModel.findOne({ email }).exec();
    if (!user?.isVerified) {
      return null;
    }
    return user;
  }

  async revokeToken(userId: string): Promise<void> {
    await this.userModel
      .updateOne(
        { _id: userId },
        {
          isTokenRevoked: true,
          $unset: { accessToken: 1, accessTokenExpires: 1 },
        },
      )
      .exec();
  }

  logout(response: Response): { message: string } {
    response.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    return { message: 'Successfully logged out' };
  }

  async getUserDetails(
    userId: string,
  ): Promise<Omit<UserDocument | MockUserProfile, 'password'>> {
    // Check if it's a mock user
    const mockUser = mockUsers.find((user) => user._id === userId);
    if (mockUser) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userWithoutPassword } = mockUser;
      return userWithoutPassword;
    }

    // Regular user flow
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Convert to plain object and remove password
    const userObject = user.toObject();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: __, ...userWithoutPassword } = userObject;
    return userWithoutPassword;
  }

  private async ensureDefaultConfig() {
    const count = await this.projectConfigModel.countDocuments();
    if (count === 0) {
      await this.projectConfigModel.create({
        appName: 'Genesis API',
        appIconPaths: ['/icons/app-icon.png'],
        appLogoUrl: '/mantra_collab_logo.ico',
        faviconUrl: '/favicon.ico',
        availableAccentColors: [
          { name: 'Blue', value: '#0077FF' },
          { name: 'Green', value: '#00CC66' },
          { name: 'Purple', value: '#6B46C1' },
        ],
        defaultAccentColorName: 'Blue',
        availableBorderRadii: [
          { name: 'None', value: '0px' },
          { name: 'Small', value: '4px' },
          { name: 'Medium', value: '8px' },
          { name: 'Large', value: '12px' },
        ],
        defaultBorderRadiusName: 'Medium',
        availableAppVersions: [
          { id: 'v1', name: 'Version 1.0', value: '1.0.0' },
        ],
        defaultAppVersionId: 'v1',
        enableApplicationConfig: true,
        availableFontSizes: [
          { name: 'Small', value: '14px' },
          { name: 'Medium', value: '16px' },
          { name: 'Large', value: '18px' },
        ],
        defaultFontSizeName: 'Medium',
        availableScales: [
          { name: 'Compact', value: '0.9' },
          { name: 'Normal', value: '1.0' },
          { name: 'Large', value: '1.1' },
        ],
        defaultScaleName: 'Normal',
        availableInterfaceDensities: [
          { name: 'Compact', value: 'compact' },
          { name: 'Comfortable', value: 'comfortable' },
          { name: 'Spacious', value: 'spacious' },
        ],
        defaultInterfaceDensity: 'comfortable',
        mockApiMode: process.env.NODE_ENV !== 'production',
      });
    }
  }

  async getProjectConfig(): Promise<ProjectConfig> {
    const config = await this.projectConfigModel.findOne().lean();
    if (!config) {
      throw new NotFoundException('Project configuration not found');
    }
    return config;
  }

  async updateProjectConfig<K extends keyof ProjectConfig>(
    key: K,
    value: ProjectConfig[K],
  ): Promise<ProjectConfig> {
    const config = await this.projectConfigModel.findOne();
    if (!config) {
      throw new NotFoundException('Project configuration not found');
    }

    // Use type assertion to handle Mongoose document update
    const configDoc = config as ProjectConfigDocument;
    configDoc.set(key, value);
    await configDoc.save();
    return configDoc.toObject() as ProjectConfig;
  }
}
