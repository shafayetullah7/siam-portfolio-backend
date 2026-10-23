import { BadRequestException } from '@nestjs/common';
import { projectPublishChecklist } from './project-publish-checklist';
import type {
  ProjectMetricRow,
  ProjectResourceRow,
  ProjectRow,
  ProjectSectionRow,
} from './projects.types';
import type { ProjectPublishChecklistContext } from './project-publish-checklist';

export function assertPublishable(
  row: ProjectRow,
  sections: ProjectSectionRow[] = [],
  resources: ProjectResourceRow[] = [],
  metrics: ProjectMetricRow[] = [],
  context: ProjectPublishChecklistContext = {},
): void {
  const { errors } = projectPublishChecklist(
    row,
    sections,
    resources,
    metrics,
    context,
  );
  if (errors.length > 0) {
    throw new BadRequestException(errors.map((item) => item.message).join('; '));
  }
}
