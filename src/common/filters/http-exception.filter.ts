import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { databaseClientErrorMessage } from '../database/database-client-error';
import { apiFailure } from '../http/api-response';
import { parseHttpExceptionBody } from '../http/parse-http-exception-body';

const THROTTLE_MESSAGE = 'Too many requests. Please try again later.';
const INTERNAL_MESSAGE = 'Internal server error';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof ThrottlerException) {
      this.logException(
        exception,
        host,
        HttpStatus.TOO_MANY_REQUESTS,
        THROTTLE_MESSAGE,
      );
      response.status(HttpStatus.TOO_MANY_REQUESTS).json(
        apiFailure(THROTTLE_MESSAGE, HttpStatus.TOO_MANY_REQUESTS),
      );
      return;
    }

    const databaseMessage = databaseClientErrorMessage(exception);
    if (databaseMessage) {
      this.logException(
        exception,
        host,
        HttpStatus.SERVICE_UNAVAILABLE,
        databaseMessage,
      );
      response.status(HttpStatus.SERVICE_UNAVAILABLE).json(
        apiFailure(databaseMessage, HttpStatus.SERVICE_UNAVAILABLE),
      );
      return;
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const body = exception.getResponse();
      const parsed = parseHttpExceptionBody(
        typeof body === 'object' && body !== null ? body : String(body),
        statusCode,
      );
      this.logException(exception, host, statusCode, parsed.message);
      response.status(statusCode).json(
        apiFailure(parsed.message, statusCode, {
          validationErrors: parsed.validationErrors,
        }),
      );
      return;
    }

    this.logException(
      exception,
      host,
      HttpStatus.INTERNAL_SERVER_ERROR,
      INTERNAL_MESSAGE,
    );
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
      apiFailure(INTERNAL_MESSAGE, HttpStatus.INTERNAL_SERVER_ERROR),
    );
  }

  private logException(
    exception: unknown,
    host: ArgumentsHost,
    statusCode: number,
    clientMessage: string,
  ): void {
    const request = host.switchToHttp().getRequest<Request>();
    const route =
      request?.method && request?.url
        ? `${request.method} ${request.url}`
        : 'HTTP request';
    const stack =
      exception instanceof Error ? exception.stack : undefined;
    const summary = `${route} → ${statusCode} ${clientMessage}`;

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(summary, stack);
      return;
    }

    if (statusCode === HttpStatus.TOO_MANY_REQUESTS) {
      this.logger.warn(summary);
      return;
    }

    this.logger.warn(stack ? `${summary}\n${stack}` : summary);
  }
}
