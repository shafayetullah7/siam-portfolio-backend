export const RESEND_PLACEHOLDER_API_KEY = 're_placeholder_replace_with_real_key';

export function isResendApiKeyConfigured(apiKey: string): boolean {
  return apiKey.startsWith('re_') && apiKey !== RESEND_PLACEHOLDER_API_KEY;
}
