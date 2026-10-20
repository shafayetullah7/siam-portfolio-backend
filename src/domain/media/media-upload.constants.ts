/** Max upload size for general files (bytes). */
export const MEDIA_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

/** Max upload size for image-only endpoint (bytes). */
export const MEDIA_IMAGE_UPLOAD_MAX_BYTES = 3 * 1024 * 1024;

export const MEDIA_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
] as const;

export const MEDIA_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export type MediaAllowedMimeType = (typeof MEDIA_ALLOWED_MIME_TYPES)[number];
