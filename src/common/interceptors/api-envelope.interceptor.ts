import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { apiSuccess, isApiEnvelope } from '../http/api-response';

@Injectable()
export class ApiEnvelopeInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        if (isApiEnvelope(data)) {
          return data;
        }
        return apiSuccess(data);
      }),
    );
  }
}
