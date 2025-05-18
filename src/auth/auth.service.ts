import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { LoginDto, RegisterDto, VerifyMfaDto } from './dto/auth.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const { email, password } = registerDto;

    // Check if user exists
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new this.userModel({
      email,
      password: hashedPassword,
    });
    await user.save();

    return { message: 'User registered successfully' };
  }

  async login(loginDto: LoginDto): Promise<{ message: string }> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate MFA code
    const mfaCode = Math.floor(100000 + Math.random() * 900000).toString();
    const mfaCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save MFA code
    user.mfaCode = mfaCode;
    user.mfaCodeExpires = mfaCodeExpires;
    await user.save();

    // Send MFA code via email
    await this.mailService.sendMfaMail({ to: email, code: mfaCode });

    return { message: 'MFA code sent to your email' };
  }

  async verifyMfa(verifyMfaDto: VerifyMfaDto): Promise<{ token: string }> {
    const { email, mfaCode } = verifyMfaDto;

    // Find user
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check MFA code
    if (
      !user.mfaCode ||
      user.mfaCode !== mfaCode ||
      !user.mfaCodeExpires ||
      user.mfaCodeExpires < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired MFA code');
    }

    // Clear MFA code
    user.mfaCode = undefined;
    user.mfaCodeExpires = undefined;
    user.isVerified = true;
    await user.save();

    // Generate JWT token
    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
    };

    return {
      token: this.jwtService.sign(payload),
    };
  }

  async validateUser(email: string): Promise<UserDocument | null> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user || !user.isVerified) {
      return null;
    }
    return user;
  }
}
