import {
  buildCloudinaryUploadOptions,
  CLOUDINARY_FOLDER_IMAGES,
  CLOUDINARY_FOLDER_MEDIA,
} from './cloudinary-upload.options';

describe('buildCloudinaryUploadOptions', () => {
  it('applies limit transform for raster images', () => {
    const opts = buildCloudinaryUploadOptions({
      folder: CLOUDINARY_FOLDER_IMAGES,
      resourceType: 'image',
      mimeType: 'image/jpeg',
    });
    expect(opts.folder).toBe(CLOUDINARY_FOLDER_IMAGES);
    expect(opts.transformation).toEqual([
      {
        width: 2048,
        height: 2048,
        crop: 'limit',
        quality: 'auto:good',
      },
    ]);
    expect(opts.flags).toBe('strip_profile');
  });

  it('strips profile for gif without size transform', () => {
    const opts = buildCloudinaryUploadOptions({
      folder: CLOUDINARY_FOLDER_IMAGES,
      resourceType: 'image',
      mimeType: 'image/gif',
    });
    expect(opts.transformation).toBeUndefined();
    expect(opts.flags).toBe('strip_profile');
  });

  it('uses folder only for pdf raw uploads', () => {
    const opts = buildCloudinaryUploadOptions({
      folder: CLOUDINARY_FOLDER_MEDIA,
      resourceType: 'raw',
      mimeType: 'application/pdf',
    });
    expect(opts.folder).toBe(CLOUDINARY_FOLDER_MEDIA);
    expect(opts.transformation).toBeUndefined();
    expect(opts.flags).toBeUndefined();
  });
});
