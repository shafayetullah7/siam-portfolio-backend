import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppConfigService } from '../../config/app-config.service';
import {
  buildCloudinaryUploadOptions,
  CLOUDINARY_FOLDER_IMAGES,
} from './cloudinary-upload.options';
import { CloudinaryService } from './cloudinary.service';

const { uploadStreamEnd, destroy } = vi.hoisted(() => ({
  uploadStreamEnd: vi.fn(),
  destroy: vi.fn().mockResolvedValue({ result: 'ok' }),
}));

vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload_stream: vi.fn(
        (
          _opts: unknown,
          callback: (
            err: Error | null,
            result?: {
              public_id: string;
              secure_url: string;
              bytes: number;
              resource_type: string;
            },
          ) => void,
        ) => ({
          end: (buffer: Buffer) => {
            uploadStreamEnd(buffer);
            callback(null, {
              public_id: 'admin/images/test-id',
              secure_url:
                'https://res.cloudinary.com/demo/image/upload/v1/admin/images/test-id',
              bytes: buffer.length,
              resource_type: 'image',
            });
          },
        }),
      ),
      destroy,
    },
  },
}));

function mockConfig(): AppConfigService {
  return {
    cloudinaryCloudName: 'demo',
    cloudinaryApiKey: 'key',
    cloudinaryApiSecret: 'secret',
  } as AppConfigService;
}

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  beforeEach(() => {
    uploadStreamEnd.mockClear();
    destroy.mockClear();
    service = new CloudinaryService(mockConfig());
  });

  it('uploadBuffer returns public id and secure url', async () => {
    const buffer = Buffer.from('fake-image');
    const result = await service.uploadBuffer(
      buffer,
      buildCloudinaryUploadOptions({
        folder: CLOUDINARY_FOLDER_IMAGES,
        resourceType: 'image',
        mimeType: 'image/png',
      }),
    );
    expect(uploadStreamEnd).toHaveBeenCalledWith(buffer);
    expect(result.publicId).toBe('admin/images/test-id');
    expect(result.secureUrl).toContain('cloudinary.com');
  });

  it('deleteFile calls uploader.destroy', async () => {
    await service.deleteFile('admin/images/test-id');
    expect(destroy).toHaveBeenCalledWith('admin/images/test-id', {
      invalidate: true,
    });
  });
});
