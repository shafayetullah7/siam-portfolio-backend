import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import type { Express } from 'express';
import { describe, expect, it } from 'vitest';
import {
  assertMimeAllowed,
  assertSizeWithinLimit,
  assertUploadFilePresent,
  validateUploadFile,
} from './validate-upload-file';
import {
  MEDIA_IMAGE_UPLOAD_MAX_BYTES,
  MEDIA_UPLOAD_MAX_BYTES,
} from './media-upload.constants';

function mockFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'test.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: 100,
    buffer: Buffer.from('x'),
    destination: '',
    filename: '',
    path: '',
    stream: null as never,
    ...overrides,
  };
}

describe('validate-upload-file', () => {
  it('rejects missing file', () => {
    expect(() => assertUploadFilePresent(undefined)).toThrow(BadRequestException);
  });

  it('rejects disallowed mime on general upload', () => {
    expect(() => assertMimeAllowed('text/plain', false)).toThrow(BadRequestException);
  });

  it('rejects pdf on image-only upload', () => {
    expect(() => assertMimeAllowed('application/pdf', true)).toThrow(BadRequestException);
  });

  it('rejects oversize general upload', () => {
    expect(() =>
      assertSizeWithinLimit(MEDIA_UPLOAD_MAX_BYTES + 1, false),
    ).toThrow(PayloadTooLargeException);
  });

  it('rejects oversize image upload', () => {
    expect(() =>
      assertSizeWithinLimit(MEDIA_IMAGE_UPLOAD_MAX_BYTES + 1, true),
    ).toThrow(PayloadTooLargeException);
  });

  it('validateUploadFile accepts valid image', () => {
    const file = mockFile();
    expect(validateUploadFile(file, true).mimetype).toBe('image/png');
  });
});
