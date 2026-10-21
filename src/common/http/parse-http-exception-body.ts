import type { FieldError } from './api-response';

const MULTER_LIMIT_MESSAGE =
  'File is too large. Check the upload size limit for this endpoint.';

type ParsedException = {
  message: string;
  validationErrors?: FieldError[];
};

function asStringMessage(message: unknown): string {
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) {
    return message.filter((m) => typeof m === 'string').join('; ');
  }
  return 'Request failed';
}

function normalizeValidationErrors(raw: unknown): FieldError[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const items: FieldError[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const obj = entry as Record<string, unknown>;
    if (typeof obj.field === 'string' && typeof obj.message === 'string') {
      items.push({ field: obj.field, message: obj.message });
      continue;
    }
    if (typeof obj.path === 'string' && typeof obj.message === 'string') {
      items.push({ field: obj.path, message: obj.message });
      continue;
    }
    if (Array.isArray(obj.path) && typeof obj.message === 'string') {
      const field = obj.path.map(String).join('.');
      items.push({ field, message: obj.message });
    }
  }
  return items.length > 0 ? items : undefined;
}

export function parseHttpExceptionBody(
  body: string | object,
  statusCode: number,
): ParsedException {
  if (typeof body === 'string') {
    if (body === 'LIMIT_FILE_SIZE' || body.includes('File too large')) {
      return { message: MULTER_LIMIT_MESSAGE };
    }
    return { message: body };
  }

  const record = body as Record<string, unknown>;
  const message = asStringMessage(record.message ?? record.error);

  const validationErrors =
    normalizeValidationErrors(record.validationErrors) ??
    normalizeValidationErrors(record.errors) ??
    normalizeValidationErrors(record.issues);

  if (
    (statusCode === 400 && message === 'LIMIT_FILE_SIZE') ||
    (typeof record.message === 'string' &&
      record.message.includes('File too large'))
  ) {
    return { message: MULTER_LIMIT_MESSAGE, validationErrors };
  }

  return { message, validationErrors };
}
