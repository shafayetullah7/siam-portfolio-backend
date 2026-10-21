/**
 * Minimal Multer file shape for admin uploads (memory storage).
 * Avoids requiring @types/multer in Docker when dev types are not installed.
 */
declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        buffer: Buffer;
      }
    }
  }
}

export {};
