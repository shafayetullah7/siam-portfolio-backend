import { Injectable, Logger } from '@nestjs/common';
import type {
  MailMessage,
  MailSendResult,
  MailTransport,
} from './mail-transport.types';

@Injectable()
export class ConsoleMailTransport implements MailTransport {
  private readonly logger = new Logger(ConsoleMailTransport.name);

  async send(message: MailMessage): Promise<MailSendResult> {
    const preview =
      message.devPreview ??
      `[mail] to=${message.to} subject="${message.subject}"`;
    this.logger.log(`[mail:console] ${preview}`);
    return {};
  }
}
