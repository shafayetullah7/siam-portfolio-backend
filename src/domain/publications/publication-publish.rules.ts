import { BadRequestException } from '@nestjs/common';
import { publicationPublishChecklist } from './publication-publish-checklist';
import type { PublicationRow } from './publications.types';

export function assertPublishable(row: PublicationRow): void {
  const { errors } = publicationPublishChecklist(row);
  if (errors.length > 0) {
    throw new BadRequestException(errors.map((item) => item.message).join('; '));
  }
}
