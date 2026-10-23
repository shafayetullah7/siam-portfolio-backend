import { describe, expect, it } from 'vitest';
import { listTimelineQuerySchema } from './list-timeline-query.dto';

describe('listTimelineQuerySchema kinds', () => {
  it('accepts comma-separated kinds query string', () => {
    const parsed = listTimelineQuerySchema.parse({
      kinds: 'award,competition,certification',
    });
    expect(parsed.kinds).toEqual(['award', 'competition', 'certification']);
  });

  it('accepts repeated kinds array', () => {
    const parsed = listTimelineQuerySchema.parse({
      kinds: ['award', 'education'],
    });
    expect(parsed.kinds).toEqual(['award', 'education']);
  });
});
