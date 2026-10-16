import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendAdminRegistrationOtp(email: string, otp: string): Promise<void> {
    this.logger.log(`Registration OTP for ${email}: ${otp}`);
  }

  async sendPasswordResetLink(email: string, link: string): Promise<void> {
    this.logger.log(`Password reset for ${email}: ${link}`);
  }
}
