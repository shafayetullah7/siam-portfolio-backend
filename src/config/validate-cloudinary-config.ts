import type { AppConfigService } from './app-config.service';
import { isCloudinaryConfigured } from '../libs/cloudinary/cloudinary-config';

export function validateCloudinaryConfigForBoot(config: AppConfigService): void {
  if (!config.isProduction) {
    return;
  }
  if (
    !isCloudinaryConfigured({
      cloudName: config.cloudinaryCloudName,
      apiKey: config.cloudinaryApiKey,
      apiSecret: config.cloudinaryApiSecret,
    })
  ) {
    throw new Error(
      'Invalid Cloudinary configuration: NODE_ENV=production requires real CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET (not placeholders).',
    );
  }
}
