import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import type { Express } from 'express';
import {
  MEDIA_ALLOWED_MIME_TYPES,
  MEDIA_IMAGE_MIME_TYPES,
  MEDIA_IMAGE_UPLOAD_MAX_BYTES,
  MEDIA_UPLOAD_MAX_BYTES,
} from './media-upload.constants';

export function assertUploadFilePresent(
  file: Express.Multer.File | undefined,
): Express.Multer.File {
  if (!file || !file.buffer?.length) {
    throw new BadRequestException('No file uploaded. Use multipart field "file".');
  }
  return file;
}

export function assertMimeAllowed(mimetype: string, imageOnly: boolean): void {
  const allowed = imageOnly
    ? MEDIA_IMAGE_MIME_TYPES
    : MEDIA_ALLOWED_MIME_TYPES;
  if (!(allowed as readonly string[]).includes(mimetype)) {
    const hint = imageOnly
      ? 'Allowed image types: JPEG, PNG, WebP, GIF.'
      : 'Allowed types: JPEG, PNG, WebP, GIF, PDF.';
    throw new BadRequestException(`File type not allowed. ${hint}`);
  }
}

export function assertSizeWithinLimit(size: number, imageOnly: boolean): void {
  const max = imageOnly
    ? MEDIA_IMAGE_UPLOAD_MAX_BYTES
    : MEDIA_UPLOAD_MAX_BYTES;
  if (size > max) {
    const maxMb = (max / (1024 * 1024)).toFixed(0);
    throw new PayloadTooLargeException(
      `File is too large. Maximum size is ${maxMb} MB.`,
    );
  }
}

export function validateUploadFile(
  file: Express.Multer.File | undefined,
  imageOnly: boolean,
): Express.Multer.File {
  const present = assertUploadFilePresent(file);
  assertMimeAllowed(present.mimetype, imageOnly);
  assertSizeWithinLimit(present.size, imageOnly);
  return present;
}
