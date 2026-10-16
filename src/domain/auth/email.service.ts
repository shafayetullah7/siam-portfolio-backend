import { Inject, Injectable } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import {
  adminPasswordResetMail,
  adminRegistrationOtpMail,
} from './admin-mail.templates';
import {
  MAIL_TRANSPORT,
  type MailTransport,
} from '../../libs/mail/mail-transport.types';

@Injectable()
export class EmailService {
  constructor(
    private readonly config: AppConfigService,
    @Inject(MAIL_TRANSPORT) private readonly transport: MailTransport,
  ) {}

  async sendAdminRegistrationOtp(email: string, otp: string): Promise<void> {
    const content = adminRegistrationOtpMail(
      otp,
      this.config.otpExpiryMinutes,
    );
    await this.transport.send({
      from: this.config.mailFrom,
      to: email,
      ...content,
      devPreview: `Registration OTP for ${email}: ${otp}`,
    });
  }

  async sendPasswordResetLink(email: string, link: string): Promise<void> {
    const content = adminPasswordResetMail(link);
    await this.transport.send({
      from: this.config.mailFrom,
      to: email,
      ...content,
      devPreview: `Password reset for ${email}: ${link}`,
    });
  }
}
