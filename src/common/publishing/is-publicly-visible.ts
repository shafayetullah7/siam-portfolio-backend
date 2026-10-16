import type { PublishStatus } from './publish-status';

export function isPubliclyVisible(
  publishStatus: PublishStatus,
  scheduledAt: Date | null,
  now: Date = new Date(),
): boolean {
  if (publishStatus === 'archived' || publishStatus === 'draft') {
    return false;
  }
  if (publishStatus === 'published') {
    return true;
  }
  if (publishStatus === 'scheduled' && scheduledAt) {
    return scheduledAt <= now;
  }
  return false;
}
