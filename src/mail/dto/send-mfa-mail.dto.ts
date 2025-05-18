import { IsEmail, IsString, Length } from 'class-validator';

export class SendMfaEmailDto {
  @IsEmail()
  to: string;

  @IsString()
  @Length(4, 10)
  code: string;
}
