import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  assertCategoryAllowed,
  assertConsentRequired,
  assertHoneypotEmpty,
  parseSubmitContactInquiry,
} from './contact-submit.validation';

describe('contact-submit.validation', () => {
  it('rejects non-empty honeypot', () => {
    expect(() => assertHoneypotEmpty('spam')).toThrow(BadRequestException);
  });

  it('requires category from configured list', () => {
    expect(() =>
      assertCategoryAllowed(undefined, ['Collaboration']),
    ).toThrow(BadRequestException);
    expect(assertCategoryAllowed('Collaboration', ['Collaboration'])).toBe(
      'Collaboration',
    );
    expect(() =>
      assertCategoryAllowed('Other', ['Collaboration']),
    ).toThrow(BadRequestException);
  });

  it('requires consent when consent text is configured', () => {
    expect(() =>
      assertConsentRequired(false, 'I agree'),
    ).toThrow(BadRequestException);
    const version = assertConsentRequired(true, 'I agree');
    expect(version).toHaveLength(16);
  });

  it('parseSubmitContactInquiry accepts valid payload', () => {
    const result = parseSubmitContactInquiry(
      {
        name: 'Ada',
        email: 'ada@example.com',
        message: 'Hello world!',
        consent: true,
      },
      { contactCategories: [], contactConsentText: null },
    );
    expect(result.parsed.name).toBe('Ada');
    expect(result.category).toBeNull();
  });
});
