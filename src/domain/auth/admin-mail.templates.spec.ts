import {
  adminPasswordResetMail,
  adminRegistrationOtpMail,
} from './admin-mail.templates';

describe('admin-mail.templates', () => {
  it('includes OTP in registration mail', () => {
    const mail = adminRegistrationOtpMail('123456', 15);
    expect(mail.subject).toContain('registration');
    expect(mail.text).toContain('123456');
    expect(mail.html).toContain('123456');
  });

  it('escapes HTML in reset link', () => {
    const mail = adminPasswordResetMail(
      'http://x.com?a=1&b=<script>',
    );
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).toContain('&lt;script&gt;');
  });
});
