export interface ApiSuccess<T> {
  success: true;
  message?: string;
  data: T;
}

export function apiSuccess<T>(data: T, message?: string): ApiSuccess<T> {
  return { success: true, data, message };
}
