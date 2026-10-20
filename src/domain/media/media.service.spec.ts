import type { Express } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CloudinaryService } from '../../libs/cloudinary/cloudinary.service';
import { MediaService } from './media.service';

describe('MediaService', () => {
  const cloudinary: CloudinaryService = {
    uploadBuffer: vi.fn().mockResolvedValue({
      publicId: 'admin/images/abc',
      secureUrl: 'https://res.cloudinary.com/demo/x',
      bytes: 4,
      resourceType: 'image',
    }),
    deleteFile: vi.fn().mockResolvedValue(undefined),
  } as unknown as CloudinaryService;

  let insertCall: number;
  let returningResult: unknown;
  let service: MediaService;

  beforeEach(() => {
    insertCall = 0;
    returningResult = [
      {
        id: 'id-1',
        fileName: 'a.png',
        url: 'https://res.cloudinary.com/demo/x',
        mimeType: 'image/png',
        size: 4,
        alt: null,
        caption: null,
        license: null,
        usesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const tx = {
      insert: vi.fn(() => ({
        values: vi.fn(() => {
          insertCall += 1;
          if (insertCall === 1) {
            return {
              returning: vi.fn().mockResolvedValue(returningResult),
            };
          }
          return Promise.resolve(undefined);
        }),
      })),
    };
    const db = {
      transaction: vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) =>
        fn(tx),
      ),
    } as never;
    service = new MediaService(db, cloudinary);
    vi.mocked(cloudinary.uploadBuffer).mockClear();
    vi.mocked(cloudinary.deleteFile).mockClear();
  });

  it('uploadFile persists after Cloudinary upload', async () => {
    const file = {
      originalname: 'a.png',
      mimetype: 'image/png',
      size: 4,
      buffer: Buffer.from('data'),
    } as Express.Multer.File;

    const result = await service.uploadFile('admin-uuid', file, {
      imageOnly: true,
    });
    expect(result.id).toBe('id-1');
    expect(cloudinary.uploadBuffer).toHaveBeenCalled();
    expect(cloudinary.deleteFile).not.toHaveBeenCalled();
    expect(insertCall).toBe(3);
  });

  it('uploadFile deletes Cloudinary asset when DB transaction fails', async () => {
    returningResult = new Error('db fail');
    const tx = {
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockRejectedValue(returningResult),
        })),
      })),
    };
    const db = {
      transaction: vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) =>
        fn(tx),
      ),
    } as never;
    service = new MediaService(db, cloudinary);

    const file = {
      originalname: 'a.png',
      mimetype: 'image/png',
      size: 4,
      buffer: Buffer.from('data'),
    } as Express.Multer.File;

    await expect(
      service.uploadFile('admin-uuid', file, { imageOnly: true }),
    ).rejects.toThrow('db fail');
    expect(cloudinary.deleteFile).toHaveBeenCalledWith('admin/images/abc');
  });
});
