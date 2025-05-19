import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole } from './schemas/user.schema';
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
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

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

  async login(loginDto: LoginDto): Promise<MfaResponseDto> {
    const { email, password } = loginDto;

    // Find user
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

  async verifyMfa(verifyMfaDto: VerifyMfaDto): Promise<AuthResponseDto> {
    const { email, mfaCode } = verifyMfaDto;

    // Find user
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

    // Generate access token with 1 hour expiration
    const expiresIn = 3600; // 1 hour in seconds
    const accessTokenExpires = new Date(Date.now() + expiresIn * 1000);

    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn });

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

  async validateUser(email: string): Promise<UserDocument | null> {
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
}
