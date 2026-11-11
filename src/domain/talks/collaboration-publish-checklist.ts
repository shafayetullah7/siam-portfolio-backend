import type { CollaborationRow } from './talks.types';

export type PublishChecklistItem = {
  code: string;
  message: string;
};

export type CollaborationPublishChecklistResult = {
  errors: PublishChecklistItem[];
  warnings: PublishChecklistItem[];
};

export type CollaborationPublishChecklistContext = {
  logoAlt?: string | null;
  logoMediaMissing?: boolean;
};

function isEmpty(value: string | null | undefined): boolean {
  return !value?.trim();
}

export function collaborationPublishChecklist(
  row: CollaborationRow,
  context: CollaborationPublishChecklistContext = {},
): CollaborationPublishChecklistResult {
  const errors: PublishChecklistItem[] = [];
  const warnings: PublishChecklistItem[] = [];

  if (isEmpty(row.partnerName)) {
    errors.push({
      code: 'partner_required',
      message: 'Partner name is required',
    });
  }
  if (isEmpty(row.summary)) {
    errors.push({ code: 'summary_required', message: 'Summary is required' });
  }

  if (row.logoMediaId) {
    if (context.logoMediaMissing) {
      errors.push({
        code: 'logo_missing',
        message: 'Logo media could not be found',
      });
    } else if (isEmpty(context.logoAlt)) {
      errors.push({
        code: 'logo_alt_required',
        message: 'Logo media must have alt text before publish',
      });
    }
  }

  return { errors, warnings };
}
