import { z } from 'zod';

export interface ApiSuccess<T> {
  success: true;
  message?: string;
  data: T;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiFailure {
  success: false;
  message: string;
  statusCode: number;
  validationErrors?: FieldError[];
}

export function apiSuccess<T>(data: T, message?: string): ApiSuccess<T> {
  return { success: true, data, message };
}

export function apiFailure(
  message: string,
  statusCode: number,
  extras?: { validationErrors?: FieldError[] },
): ApiFailure {
  return {
    success: false,
    message,
    statusCode,
    ...(extras?.validationErrors?.length
      ? { validationErrors: extras.validationErrors }
      : {}),
  };
}

export function isApiEnvelope(
  value: unknown,
): value is ApiSuccess<unknown> | ApiFailure {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as { success: unknown }).success === 'boolean'
  );
}

export const fieldErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
});

export const apiFailureSchema = z
  .object({
    success: z.literal(false),
    message: z.string(),
    statusCode: z.number().int(),
    validationErrors: z.array(fieldErrorSchema).optional(),
  })
  .meta({ title: 'ApiFailure' });

export function apiSuccessEnvelopeSchema<T extends z.ZodType>(dataSchema: T) {
  return z
    .object({
      success: z.literal(true),
      message: z.string().optional(),
      data: dataSchema,
    })
    .meta({ title: 'ApiSuccess' });
}
