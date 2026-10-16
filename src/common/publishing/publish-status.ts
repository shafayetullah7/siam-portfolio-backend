export const PUBLISH_STATUSES = [
  'draft',
  'published',
  'scheduled',
  'archived',
] as const;

export type PublishStatus = (typeof PUBLISH_STATUSES)[number];

export function isPublishStatus(value: string): value is PublishStatus {
  return (PUBLISH_STATUSES as readonly string[]).includes(value);
}
