import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Express } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CloudinaryService } from '../../libs/cloudinary/cloudinary.service';
import { MediaService } from './media.service';

const mediaRow = {
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
};

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
    returningResult = [mediaRow];
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

  describe('deleteById', () => {
    it('throws 403 when usesCount > 0', async () => {
      const db = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue([
                { ...mediaRow, usesCount: 2 },
              ]),
            })),
          })),
        })),
      } as never;
      const svc = new MediaService(db, cloudinary);

      await expect(svc.deleteById('id-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(cloudinary.deleteFile).not.toHaveBeenCalled();
    });

    it('deletes DB row then Cloudinary asset', async () => {
      const deleteWhere = vi.fn().mockResolvedValue(undefined);
      let selectCall = 0;
      const limit = vi.fn().mockImplementation(() => {
        selectCall += 1;
        if (selectCall === 1) return Promise.resolve([mediaRow]);
        if (selectCall === 2) {
          return Promise.resolve([{ publicKey: 'admin/images/abc' }]);
        }
        return Promise.resolve([]);
      });
      const chain = () => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({ limit })),
        })),
      });
      const db = {
        select: vi.fn(chain),
        delete: vi.fn(() => ({
          where: deleteWhere,
        })),
      } as never;
      const svc = new MediaService(db, cloudinary);

      await svc.deleteById('id-1');
      expect(deleteWhere).toHaveBeenCalled();
      expect(cloudinary.deleteFile).toHaveBeenCalledWith('admin/images/abc');
    });
  });

  describe('updateMetadata', () => {
    it('updates alt on existing media', async () => {
      const updated = { ...mediaRow, alt: 'New alt' };
      const db = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue([mediaRow]),
            })),
          })),
        })),
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn(() => ({
              returning: vi.fn().mockResolvedValue([updated]),
            })),
          })),
        })),
      } as never;
      const svc = new MediaService(db, cloudinary);

      const result = await svc.updateMetadata('id-1', { alt: 'New alt' });
      expect(result.alt).toBe('New alt');
    });

    it('throws NotFoundException when media missing', async () => {
      const db = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue([]),
            })),
          })),
        })),
      } as never;
      const svc = new MediaService(db, cloudinary);

      await expect(
        svc.updateMetadata('missing', { alt: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
