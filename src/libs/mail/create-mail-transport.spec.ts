import { Logger } from '@nestjs/common';
import type { AppConfigService } from '../../config/app-config.service';
import { ConsoleMailTransport } from './console-mail.transport';
import { createMailTransport } from './create-mail-transport';
import { RESEND_PLACEHOLDER_API_KEY } from './mail-config';
import { ResendMailTransport } from './resend-mail.transport';

function mockConfig(
  partial: Partial<AppConfigService>,
): AppConfigService {
  return {
    mailProvider: 'console',
    resendApiKey: RESEND_PLACEHOLDER_API_KEY,
    isProduction: false,
    ...partial,
  } as AppConfigService;
}

describe('createMailTransport', () => {
  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ConsoleMailTransport when provider is console', () => {
    const t = createMailTransport(mockConfig({ mailProvider: 'console' }));
    expect(t).toBeInstanceOf(ConsoleMailTransport);
  });

  it('returns ResendMailTransport when provider is resend and key is set', () => {
    const t = createMailTransport(
      mockConfig({
        mailProvider: 'resend',
        resendApiKey: 're_live_test_key_12345',
      }),
    );
    expect(t).toBeInstanceOf(ResendMailTransport);
  });

  it('falls back to console in non-production when key is placeholder', () => {
    const t = createMailTransport(
      mockConfig({ mailProvider: 'resend', isProduction: false }),
    );
    expect(t).toBeInstanceOf(ConsoleMailTransport);
  });

  it('throws in production when resend key is placeholder', () => {
    expect(() =>
      createMailTransport(
        mockConfig({ mailProvider: 'resend', isProduction: true }),
      ),
    ).toThrow(/RESEND_API_KEY/);
  });
});
