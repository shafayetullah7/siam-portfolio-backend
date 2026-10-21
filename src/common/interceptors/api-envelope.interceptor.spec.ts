import { lastValueFrom, of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { apiSuccess } from '../http/api-response';
import { ApiEnvelopeInterceptor } from './api-envelope.interceptor';

describe('ApiEnvelopeInterceptor', () => {
  const interceptor = new ApiEnvelopeInterceptor();

  it('wraps raw handler data', async () => {
    const result = await lastValueFrom(
      interceptor.intercept({} as never, {
        handle: () => of({ id: '1' }),
      }),
    );
    expect(result).toEqual({ success: true, data: { id: '1' } });
  });

  it('does not double-wrap apiSuccess', async () => {
    const envelope = apiSuccess({ ok: true });
    const result = await lastValueFrom(
      interceptor.intercept({} as never, {
        handle: () => of(envelope),
      }),
    );
    expect(result).toEqual(envelope);
  });
});
