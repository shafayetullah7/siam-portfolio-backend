import { Resend } from 'resend';
import type { MailMessage } from './mail-transport.types';

export async function sendWithResend(
  apiKey: string,
  message: MailMessage,
): Promise<{ id: string } | undefined> {
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: message.from,
    to: [message.to],
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
  if (error) {
    throw new Error(error.message);
  }
  return data?.id ? { id: data.id } : undefined;
}
