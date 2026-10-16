export type MailContent = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function adminRegistrationOtpMail(
  otp: string,
  expiryMinutes: number,
): MailContent {
  const safeOtp = escapeHtml(otp);
  const subject = 'SIAM admin registration code';
  const text = `Your SIAM admin registration code is: ${otp}\n\nIt expires in ${expiryMinutes} minutes.`;
  const html = `<p>Your SIAM admin registration code is:</p><p style="font-size:1.5rem;font-weight:bold;letter-spacing:0.2em">${safeOtp}</p><p>This code expires in ${expiryMinutes} minutes.</p>`;
  return { subject, html, text };
}

export function adminPasswordResetMail(link: string): MailContent {
  const safeLink = escapeHtml(link);
  const subject = 'Reset your SIAM admin password';
  const text = `Reset your password using this link (expires in 1 hour):\n${link}`;
  const html = `<p>Reset your SIAM admin password using the link below. The link expires in one hour.</p><p><a href="${safeLink}">${safeLink}</a></p>`;
  return { subject, html, text };
}
