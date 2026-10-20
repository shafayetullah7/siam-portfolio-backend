export const CLOUDINARY_PLACEHOLDER_CLOUD_NAME = 'placeholder_cloud_name';
export const CLOUDINARY_PLACEHOLDER_API_KEY = 'placeholder_api_key';
export const CLOUDINARY_PLACEHOLDER_API_SECRET = 'placeholder_api_secret';

export function isCloudinaryConfigured(config: {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}): boolean {
  return (
    config.cloudName !== CLOUDINARY_PLACEHOLDER_CLOUD_NAME &&
    config.apiKey !== CLOUDINARY_PLACEHOLDER_API_KEY &&
    config.apiSecret !== CLOUDINARY_PLACEHOLDER_API_SECRET
  );
}
