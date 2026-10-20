import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';
import { AppConfigService } from '../../config/app-config.service';
import type { CloudinaryUploadOptions } from './cloudinary-upload.options';

export type CloudinaryUploadResult = {
  publicId: string;
  secureUrl: string;
  bytes: number;
  resourceType: string;
};

@Injectable()
export class CloudinaryService {
  private configured = false;

  constructor(private readonly config: AppConfigService) {
    this.ensureConfigured();
  }

  private ensureConfigured(): void {
    if (this.configured) return;
    cloudinary.config({
      cloud_name: this.config.cloudinaryCloudName,
      api_key: this.config.cloudinaryApiKey,
      api_secret: this.config.cloudinaryApiSecret,
      secure: true,
    });
    this.configured = true;
  }

  async uploadBuffer(
    buffer: Buffer,
    options: CloudinaryUploadOptions,
  ): Promise<CloudinaryUploadResult> {
    this.ensureConfigured();
    return new Promise((resolve, reject) => {
      const uploadOptions: Record<string, unknown> = {
        folder: options.folder,
        resource_type: options.resource_type ?? 'auto',
      };
      if (options.transformation) {
        uploadOptions.transformation = options.transformation;
      }
      if (options.flags) {
        uploadOptions.flags = options.flags;
      }

      const stream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            reject(error ?? new Error('Cloudinary upload failed'));
            return;
          }
          resolve({
            publicId: result.public_id,
            secureUrl: result.secure_url,
            bytes: result.bytes,
            resourceType: result.resource_type,
          });
        },
      );
      stream.end(buffer);
    });
  }

  async deleteFile(publicId: string): Promise<void> {
    this.ensureConfigured();
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  }
}
