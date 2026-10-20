export const CLOUDINARY_FOLDER_MEDIA = 'admin/media';
export const CLOUDINARY_FOLDER_IMAGES = 'admin/images';

export type CloudinaryResourceType = 'image' | 'raw' | 'video' | 'auto';

export type BuildCloudinaryUploadOptionsInput = {
  folder: string;
  resourceType: CloudinaryResourceType;
  mimeType?: string;
};

export type CloudinaryUploadOptions = {
  folder: string;
  resource_type?: CloudinaryResourceType;
  transformation?: Array<Record<string, unknown>>;
  flags?: string;
};

function isRasterImage(mimeType?: string): boolean {
  if (!mimeType) return false;
  return ['image/jpeg', 'image/png', 'image/webp'].includes(mimeType);
}

function isGif(mimeType?: string): boolean {
  return mimeType === 'image/gif';
}

export function buildCloudinaryUploadOptions(
  input: BuildCloudinaryUploadOptionsInput,
): CloudinaryUploadOptions {
  const base: CloudinaryUploadOptions = {
    folder: input.folder,
    resource_type: input.resourceType,
  };

  if (isRasterImage(input.mimeType)) {
    return {
      ...base,
      transformation: [
        {
          width: 2048,
          height: 2048,
          crop: 'limit',
          quality: 'auto:good',
        },
      ],
      flags: 'strip_profile',
    };
  }

  if (isGif(input.mimeType)) {
    return {
      ...base,
      flags: 'strip_profile',
    };
  }

  return base;
}
