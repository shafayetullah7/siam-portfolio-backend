export type MailMessage = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Full preview for ConsoleMailTransport only (may contain OTP or reset URL). */
  devPreview?: string;
};

export type MailSendResult = {
  messageId?: string;
};

export interface MailTransport {
  send(message: MailMessage): Promise<MailSendResult>;
}

export const MAIL_TRANSPORT = Symbol('MAIL_TRANSPORT');
