import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly resendFromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resendFromEmail =
      this.configService.get<string>('RESEND_FROM_EMAIL') ||
      'onboarding@resend.dev';
    if (!apiKey) {
      throw new Error('Resend API key is missing!');
    }
    this.resend = new Resend(apiKey);
  }

  async sendMfaMail(params: { to: string; code: string }): Promise<void> {
    await this.resend.emails.send({
      from: this.resendFromEmail,
      to: params.to,
      subject: 'Your MFA Code',
      text: `Your one-time MFA code is: ${params.code}`,
    });
  }
}
