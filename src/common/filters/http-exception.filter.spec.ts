import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { describe, expect, it, vi } from 'vitest';
import { DrizzleQueryError } from 'drizzle-orm';
import { DATABASE_SCHEMA_OUT_OF_DATE_MESSAGE } from '../database/database-client-error';
import { HttpExceptionFilter } from './http-exception.filter';

function mockHost() {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  return {
    host: {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ method: 'GET', url: '/test' }),
      }),
    } as never,
    status,
    json,
  };
}

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  it('maps NotFoundException to failure envelope', () => {
    const { host, status, json } = mockHost();
    filter.catch(new NotFoundException('Media not found'), host);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      success: false,
      message: 'Media not found',
      statusCode: 404,
    });
  });

  it('maps ForbiddenException to failure envelope', () => {
    const { host, status, json } = mockHost();
    filter.catch(
      new ForbiddenException('This file is in use and cannot be deleted.'),
      host,
    );
    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({
      success: false,
      message: 'This file is in use and cannot be deleted.',
      statusCode: 403,
    });
  });

  it('maps ThrottlerException to failure envelope', () => {
    const { host, status, json } = mockHost();
    filter.catch(new ThrottlerException(), host);
    expect(status).toHaveBeenCalledWith(429);
    expect(json).toHaveBeenCalledWith({
      success: false,
      message: 'Too many requests. Please try again later.',
      statusCode: 429,
    });
  });

  it('extracts validationErrors from exception body', () => {
    const { host, json } = mockHost();
    filter.catch(
      new BadRequestException({
        message: 'Validation failed',
        validationErrors: [{ field: 'email', message: 'Invalid email' }],
      }),
      host,
    );
    expect(json).toHaveBeenCalledWith({
      success: false,
      message: 'Validation failed',
      statusCode: 400,
      validationErrors: [{ field: 'email', message: 'Invalid email' }],
    });
  });

  it('maps schema drift query errors to 503 with migration hint', () => {
    const { host, status, json } = mockHost();
    const pg = Object.assign(new Error('column "pdf_media_id" does not exist'), {
      code: '42703',
    });
    filter.catch(new DrizzleQueryError('select', [], pg), host);
    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith({
      success: false,
      message: DATABASE_SCHEMA_OUT_OF_DATE_MESSAGE,
      statusCode: 503,
    });
  });

  it('maps unknown errors to 500 envelope', () => {
    const { host, status, json } = mockHost();
    filter.catch(new Error('boom'), host);
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal server error',
      statusCode: 500,
    });
  });
});
