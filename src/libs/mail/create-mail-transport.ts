import { Logger } from '@nestjs/common';
import type { AppConfigService } from '../../config/app-config.service';
import { ConsoleMailTransport } from './console-mail.transport';
import { isResendApiKeyConfigured } from './mail-config';
import type { MailTransport } from './mail-transport.types';
import { ResendMailTransport } from './resend-mail.transport';

export function createMailTransport(config: AppConfigService): MailTransport {
  if (config.mailProvider === 'console') {
    return new ConsoleMailTransport();
  }

  if (!isResendApiKeyConfigured(config.resendApiKey)) {
    if (config.isProduction) {
      throw new Error(
        'MAIL_PROVIDER=resend requires a valid RESEND_API_KEY in production',
      );
    }
    Logger.warn(
      'MAIL_PROVIDER=resend but RESEND_API_KEY is missing or still the placeholder — using console mail transport',
      'MailModule',
    );
    return new ConsoleMailTransport();
  }

  return new ResendMailTransport(config.resendApiKey);
}
