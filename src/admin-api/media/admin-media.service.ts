import { Injectable } from '@nestjs/common';
import { MediaService } from '../../domain/media/media.service';

@Injectable()
export class AdminMediaService {
  constructor(private readonly media: MediaService) {}

  list() {
    return this.media.list();
  }

  createPlaceholder(body: Record<string, unknown>) {
    return this.media.createPlaceholder(body as never);
  }
}
