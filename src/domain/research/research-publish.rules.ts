import { BadRequestException } from '@nestjs/common';
import {
  researchPublishChecklist,
  type ResearchPublishChecklistContext,
} from './research-publish-checklist';
import type { ResearchThemeRow } from './research.types';

export function assertPublishable(
  theme: ResearchThemeRow,
  context: ResearchPublishChecklistContext = {},
): void {
  const { errors } = researchPublishChecklist(theme, context);
  if (errors.length > 0) {
    throw new BadRequestException(
      errors.map((item) => item.message).join('; '),
    );
  }
}
