import { BadRequestException } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContactTurnstileService } from './contact-turnstile.service';

function appConfig(overrides: {
  isTurnstileEnabled?: boolean;
  turnstileSecretKey?: string;
}) {
  return {
    isTurnstileEnabled: overrides.isTurnstileEnabled ?? false,
    turnstileSecretKey: overrides.turnstileSecretKey,
    turnstileSiteKey: 'site-key',
  };
}

describe('ContactTurnstileService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('no-ops when Turnstile is disabled', async () => {
    const service = new ContactTurnstileService(
      appConfig({ isTurnstileEnabled: false }) as never,
    );
    await expect(service.verify(undefined)).resolves.toBeUndefined();
  });

  it('requires token when enabled', async () => {
    const service = new ContactTurnstileService(
      appConfig({
        isTurnstileEnabled: true,
        turnstileSecretKey: 'secret',
      }) as never,
    );
    await expect(service.verify(undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects when siteverify returns success false', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: false }),
      }),
    );
    const service = new ContactTurnstileService(
      appConfig({
        isTurnstileEnabled: true,
        turnstileSecretKey: 'secret',
      }) as never,
    );
    await expect(service.verify('token')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
