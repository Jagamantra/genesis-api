import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address for registration',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'MyPassword123!',
    description: 'Password for the account (minimum 6 characters)',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address for login',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'MyPassword123!',
    description: 'Password for the account',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class VerifyMfaDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address associated with the MFA code',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Six-digit MFA code sent to email',
    pattern: '^[0-9]{6}$',
  })
  @IsString()
  @IsNotEmpty()
  mfaCode: string;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token for authentication',
  })
  accessToken: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email of the authenticated user',
  })
  email: string;

  @ApiProperty({
    example: 'user',
    description: 'Role of the authenticated user',
    enum: ['user', 'admin'],
  })
  role: string;

  @ApiProperty({
    example: 3600,
    description: 'Number of seconds until the token expires',
  })
  expiresIn: number;
}

export class MfaResponseDto {
  @ApiProperty({
    example: true,
    description: 'Whether the MFA code was sent successfully',
  })
  codeSent: boolean;

  @ApiProperty({
    example: 'MFA code sent to user@example.com',
    description: 'Status message',
  })
  message: string;
}
