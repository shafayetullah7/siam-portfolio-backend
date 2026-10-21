declare module 'multer' {
  import type { Request, RequestHandler } from 'express';

  interface StorageEngine {
    _handleFile(
      req: Request,
      file: Express.Multer.File,
      callback: (error?: Error | null, info?: Partial<Express.Multer.File>) => void,
    ): void;
    _removeFile(
      req: Request,
      file: Express.Multer.File,
      callback: (error: Error | null) => void,
    ): void;
  }

  interface Options {
    storage?: StorageEngine;
    limits?: { fileSize?: number };
  }

  function multer(options?: Options): { single(field: string): RequestHandler };

  export function memoryStorage(): StorageEngine;
  export default multer;
}
