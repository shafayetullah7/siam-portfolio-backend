import { describe, expect, it } from 'vitest';
import { talkRow } from './talks.test-helpers';
import {
  isValidIanaTimezone,
  talkPublishChecklist,
} from './talk-publish-checklist';

describe('talkPublishChecklist', () => {
  it('blocks when timezone missing', () => {
    const row = talkRow({ timezone: '' });
    const result = talkPublishChecklist(row, {
      resourceCount: 1,
      slugTaken: false,
    });
    expect(result.errors.some((e) => e.code === 'timezone_required')).toBe(
      true,
    );
  });

  it('warns when no materials', () => {
    const row = talkRow();
    const result = talkPublishChecklist(row, {
      resourceCount: 0,
      slugTaken: false,
    });
    expect(result.warnings.some((w) => w.code === 'no_materials')).toBe(true);
  });
});

describe('isValidIanaTimezone', () => {
  it('accepts UTC', () => {
    expect(isValidIanaTimezone('UTC')).toBe(true);
  });
  it('rejects garbage', () => {
    expect(isValidIanaTimezone('Not/A_Zone')).toBe(false);
  });
});
