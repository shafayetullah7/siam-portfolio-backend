import { Test, TestingModule } from '@nestjs/testing';
import { AppConfigService } from '../../config/app-config.service';
import { MAIL_TRANSPORT, type MailTransport } from '../../libs/mail/mail-transport.types';
import { EmailService } from './email.service';

describe('EmailService', () => {
  const transport: MailTransport = {
    send: vi.fn().mockResolvedValue({}),
  };

  const config = {
    mailFrom: 'SIAM Admin <onboarding@resend.dev>',
    otpExpiryMinutes: 15,
  };

  beforeEach(() => {
    vi.mocked(transport.send).mockClear();
  });

  async function createService() {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: AppConfigService, useValue: config },
        { provide: MAIL_TRANSPORT, useValue: transport },
      ],
    }).compile();
    return module.get(EmailService);
  }

  it('sends registration OTP via transport with devPreview', async () => {
    const service = await createService();
    await service.sendAdminRegistrationOtp('owner@example.com', '123456');
    expect(transport.send).toHaveBeenCalledOnce();
    const msg = vi.mocked(transport.send).mock.calls[0][0];
    expect(msg.to).toBe('owner@example.com');
    expect(msg.devPreview).toContain('123456');
    expect(msg.text).toContain('123456');
  });

  it('sends password reset via transport', async () => {
    const service = await createService();
    const link = 'http://localhost:3000/admin/reset-password?token=abc';
    await service.sendPasswordResetLink('user@example.com', link);
    expect(transport.send).toHaveBeenCalledOnce();
    const msg = vi.mocked(transport.send).mock.calls[0][0];
    expect(msg.html).toContain(link);
    expect(msg.devPreview).toContain(link);
  });
});
