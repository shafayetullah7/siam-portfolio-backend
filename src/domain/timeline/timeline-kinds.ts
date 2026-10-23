export const ACHIEVEMENT_KINDS = [
  'award',
  'competition',
  'scholarship_fellowship_grant',
  'certification',
  'recognition_service',
] as const;

export const EXPERIENCE_KINDS = [
  'education',
  'research_experience',
  'industry_experience',
  'teaching_mentoring',
  'affiliation',
] as const;

export const ALL_TIMELINE_KINDS = [
  ...ACHIEVEMENT_KINDS,
  ...EXPERIENCE_KINDS,
] as const;

export type TimelineEntryKind = (typeof ALL_TIMELINE_KINDS)[number];

const achievementSet = new Set<string>(ACHIEVEMENT_KINDS);

export function isAchievementKind(kind: TimelineEntryKind): boolean {
  return achievementSet.has(kind);
}

export function isExperienceKind(kind: TimelineEntryKind): boolean {
  return !isAchievementKind(kind);
}

export function assertTimelineKind(kind: string): TimelineEntryKind {
  if (!ALL_TIMELINE_KINDS.includes(kind as TimelineEntryKind)) {
    throw new Error(`Invalid timeline entry kind: ${kind}`);
  }
  return kind as TimelineEntryKind;
}
