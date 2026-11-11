import { describe, expect, it } from 'vitest';
import { profilePublishChecklist } from './profile-publish-checklist';

describe('profilePublishChecklist', () => {
  it('requires display name or headline', () => {
    const result = profilePublishChecklist({
      displayName: null,
      headline: null,
      portraitMediaId: null,
      portraitMediaAlt: null,
    });
    expect(result.errors.map((e) => e.code)).toContain('IDENTITY_NAME_REQUIRED');
  });

  it('requires portrait alt when portrait set', () => {
    const result = profilePublishChecklist({
      displayName: 'Ada',
      headline: null,
      portraitMediaId: '00000000-0000-4000-8000-000000000099',
      portraitMediaAlt: null,
    });
    expect(result.errors.map((e) => e.code)).toContain('PORTRAIT_ALT_REQUIRED');
  });
});
