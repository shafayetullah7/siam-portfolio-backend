import type { AcademicServiceEntryRow } from './talks.types';

export type PublishChecklistItem = {
  code: string;
  message: string;
};

export type AcademicServicePublishChecklistResult = {
  errors: PublishChecklistItem[];
  warnings: PublishChecklistItem[];
};

function isEmpty(value: string | null | undefined): boolean {
  return !value?.trim();
}

export function academicServicePublishChecklist(
  row: AcademicServiceEntryRow,
): AcademicServicePublishChecklistResult {
  const errors: PublishChecklistItem[] = [];
  const warnings: PublishChecklistItem[] = [];

  if (isEmpty(row.organization)) {
    errors.push({
      code: 'organization_required',
      message: 'Organization is required',
    });
  }
  if (isEmpty(row.roleTitle)) {
    errors.push({
      code: 'role_title_required',
      message: 'Role title is required',
    });
  }
  if (isEmpty(row.proofUrl)) {
    warnings.push({
      code: 'proof_url_missing',
      message: 'No proof URL is linked',
    });
  }

  return { errors, warnings };
}
