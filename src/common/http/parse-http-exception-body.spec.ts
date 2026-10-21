import { describe, expect, it } from 'vitest';
import { parseHttpExceptionBody } from './parse-http-exception-body';

describe('parseHttpExceptionBody', () => {
  it('joins array messages', () => {
    const parsed = parseHttpExceptionBody(
      { message: ['a', 'b'] },
      400,
    );
    expect(parsed.message).toBe('a; b');
  });

  it('maps multer limit code', () => {
    const parsed = parseHttpExceptionBody('LIMIT_FILE_SIZE', 400);
    expect(parsed.message).toContain('too large');
  });

  it('normalizes issue paths', () => {
    const parsed = parseHttpExceptionBody(
      {
        message: 'Validation failed',
        issues: [{ path: ['email'], message: 'Required' }],
      },
      400,
    );
    expect(parsed.validationErrors).toEqual([
      { field: 'email', message: 'Required' },
    ]);
  });
});
