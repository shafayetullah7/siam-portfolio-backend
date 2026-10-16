import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { Response } from 'express';

const THROTTLE_MESSAGE = 'Too many requests. Please try again later.';

@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  catch(_exception: ThrottlerException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(429).json({
      success: false,
      message: THROTTLE_MESSAGE,
      statusCode: 429,
    });
  }
}
