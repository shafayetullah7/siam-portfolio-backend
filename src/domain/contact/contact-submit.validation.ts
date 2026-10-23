import { BadRequestException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { z, ZodError } from 'zod';

export const submitContactInquirySchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.email().max(320),
  message: z.string().trim().min(10).max(5000),
  category: z.string().trim().max(100).optional(),
  affiliation: z.string().trim().max(200).optional(),
  consent: z.boolean(),
  website: z.string().optional(),
  turnstileToken: z.string().optional(),
});

export type SubmitContactInquiryInput = z.infer<typeof submitContactInquirySchema>;

export type SubmitContactRequestContext = {
  ip?: string;
  userAgent?: string;
};

export function assertHoneypotEmpty(website: string | undefined): void {
  if (website?.trim()) {
    throw new BadRequestException('Invalid submission');
  }
}

export function assertCategoryAllowed(
  category: string | undefined,
  categories: string[],
): string | null {
  const trimmed = category?.trim() ?? '';
  if (categories.length > 0) {
    if (!trimmed) {
      throw new BadRequestException('Category is required');
    }
    if (!categories.includes(trimmed)) {
      throw new BadRequestException('Invalid category');
    }
    return trimmed;
  }
  return trimmed === '' ? null : trimmed;
}

export function assertConsentRequired(
  consent: boolean,
  consentText: string | null,
): string | null {
  const text = consentText?.trim() ?? '';
  if (!text) return null;
  if (!consent) {
    throw new BadRequestException('Consent is required');
  }
  return createHash('sha256').update(text).digest('hex').slice(0, 16);
}

export function parseSubmitContactInquiry(
  input: unknown,
  settings: {
    contactCategories: string[] | null;
    contactConsentText: string | null;
  },
): {
  parsed: SubmitContactInquiryInput;
  category: string | null;
  consentTextVersion: string | null;
} {
  let parsed: SubmitContactInquiryInput;
  try {
    parsed = submitContactInquirySchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BadRequestException('Invalid inquiry');
    }
    throw error;
  }
  assertHoneypotEmpty(parsed.website);
  const categories = Array.isArray(settings.contactCategories)
    ? settings.contactCategories
    : [];
  const category = assertCategoryAllowed(parsed.category, categories);
  const consentTextVersion = assertConsentRequired(
    parsed.consent,
    settings.contactConsentText,
  );
  return { parsed, category, consentTextVersion };
}
