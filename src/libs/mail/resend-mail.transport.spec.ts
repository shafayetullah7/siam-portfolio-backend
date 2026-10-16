import { Logger } from '@nestjs/common';
import * as sender from './resend-mail.sender';
import { ResendMailTransport } from './resend-mail.transport';

describe('ResendMailTransport', () => {
  const sendWithResend = vi.spyOn(sender, 'sendWithResend');

  beforeEach(() => {
    sendWithResend.mockReset();
    sendWithResend.mockResolvedValue({ id: 'msg-1' });
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls Resend API and returns messageId', async () => {
    const transport = new ResendMailTransport('re_test_key');
    const result = await transport.send({
      from: 'from@example.com',
      to: 'to@example.com',
      subject: 'Test',
      html: '<p>hi</p>',
      text: 'hi',
    });
    expect(sendWithResend).toHaveBeenCalledOnce();
    expect(result.messageId).toBe('msg-1');
  });
});
