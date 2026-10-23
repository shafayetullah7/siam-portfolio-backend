import { describe, expect, it, vi } from 'vitest';
import { PublicContactService } from './public-contact.service';

describe('PublicContactService', () => {
  it('merges turnstile site key when enabled', async () => {
    const contactService = { submitInquiry: vi.fn() };
    const siteService = {
      getContactConfig: vi.fn().mockResolvedValue({
        formEnabled: true,
        intro: 'Hi',
        collaborationGuidance: null,
        responseTimeNote: null,
        categories: ['Other'],
        consentText: null,
        successMessage: null,
        publicEmail: null,
        showEmailOnPage: false,
      }),
    };
    const appConfig = {
      isTurnstileEnabled: true,
      turnstileSiteKey: 'site-key-public',
    };
    const service = new PublicContactService(
      contactService as never,
      siteService as never,
      appConfig as never,
    );
    const config = await service.getConfig();
    expect(config.turnstileSiteKey).toBe('site-key-public');
    expect(config.categories).toEqual(['Other']);
  });

  it('submit returns acknowledged without leaking row', async () => {
    const contactService = {
      submitInquiry: vi.fn().mockResolvedValue({
        id: 'secret-id',
        senderEmail: 'ada@example.com',
        body: 'private',
      }),
    };
    const service = new PublicContactService(
      contactService as never,
      { getContactConfig: vi.fn() } as never,
      { isTurnstileEnabled: false } as never,
    );
    const result = await service.submit(
      {
        name: 'Ada',
        email: 'ada@example.com',
        message: 'Hello world!',
        consent: false,
      },
      { ip: '127.0.0.1' },
    );
    expect(result).toEqual({ acknowledged: true });
  });
});
