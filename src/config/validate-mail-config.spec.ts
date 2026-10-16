import type { AppConfigService } from './app-config.service';
import { validateMailConfigForBoot } from './validate-mail-config';
import { RESEND_PLACEHOLDER_API_KEY } from '../libs/mail/mail-config';

function mockConfig(partial: Partial<AppConfigService>): AppConfigService {
  return partial as AppConfigService;
}

describe('validateMailConfigForBoot', () => {
  it('allows console in production', () => {
    expect(() =>
      validateMailConfigForBoot(
        mockConfig({ isProduction: true, mailProvider: 'console' }),
      ),
    ).not.toThrow();
  });

  it('throws when production resend has placeholder key', () => {
    expect(() =>
      validateMailConfigForBoot(
        mockConfig({
          isProduction: true,
          mailProvider: 'resend',
          resendApiKey: RESEND_PLACEHOLDER_API_KEY,
        }),
      ),
    ).toThrow();
  });

  it('allows production resend with real key', () => {
    expect(() =>
      validateMailConfigForBoot(
        mockConfig({
          isProduction: true,
          mailProvider: 'resend',
          resendApiKey: 're_production_key_abcdef',
        }),
      ),
    ).not.toThrow();
  });
});
