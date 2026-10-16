import type { AppConfigService } from './app-config.service';
import { isResendApiKeyConfigured } from '../libs/mail/mail-config';

export function validateMailConfigForBoot(config: AppConfigService): void {
  if (!config.isProduction) {
    return;
  }
  if (config.mailProvider !== 'resend') {
    return;
  }
  if (!isResendApiKeyConfigured(config.resendApiKey)) {
    throw new Error(
      'Invalid mail configuration: NODE_ENV=production and MAIL_PROVIDER=resend require a real RESEND_API_KEY (not the placeholder).',
    );
  }
}
