import type { PublishChecklistItem, PublishChecklistResult } from './publish-checklist.types';

export type ProfilePublishChecklistInput = {
  displayName: string | null;
  headline: string | null;
  portraitMediaId: string | null;
  portraitMediaAlt: string | null;
  portraitMediaMissing?: boolean;
};

function isEmpty(value: string | null | undefined): boolean {
  return !value?.trim();
}

export function profilePublishChecklist(
  input: ProfilePublishChecklistInput,
): PublishChecklistResult {
  const errors: PublishChecklistItem[] = [];
  const warnings: PublishChecklistItem[] = [];

  if (isEmpty(input.displayName) && isEmpty(input.headline)) {
    errors.push({
      code: 'IDENTITY_NAME_REQUIRED',
      message: 'Display name or headline is required before publishing profile.',
    });
  }

  if (input.portraitMediaId) {
    if (input.portraitMediaMissing) {
      errors.push({
        code: 'PORTRAIT_MEDIA_MISSING',
        message: 'Portrait image is missing from the media library.',
      });
    } else if (isEmpty(input.portraitMediaAlt)) {
      errors.push({
        code: 'PORTRAIT_ALT_REQUIRED',
        message: 'Portrait must have alt text in the media library.',
      });
    }
  }

  return { errors, warnings };
}
