import { Injectable, Logger } from '@nestjs/common';
import { sendWithResend } from './resend-mail.sender';
import type {
  MailMessage,
  MailSendResult,
  MailTransport,
} from './mail-transport.types';

@Injectable()
export class ResendMailTransport implements MailTransport {
  private readonly logger = new Logger(ResendMailTransport.name);

  constructor(private readonly apiKey: string) {}

  async send(message: MailMessage): Promise<MailSendResult> {
    const result = await sendWithResend(this.apiKey, message);
    this.logger.log(
      `[mail:resend] Sent "${message.subject}" to ${message.to}` +
        (result?.id ? ` (id=${result.id})` : ''),
    );
    return { messageId: result?.id };
  }
}
