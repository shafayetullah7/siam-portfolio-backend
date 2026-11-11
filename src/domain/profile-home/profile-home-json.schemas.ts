import { z } from 'zod';

export const scholarlyProfileLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  subtitle: z.string().optional(),
});

export const homeHighlightSchema = z.object({
  text: z.string().min(1),
  sourceUrl: z.string().optional(),
  asOfDate: z.string().optional(),
  title: z.string().optional(),
  badge: z.string().optional(),
  dateLabel: z.string().optional(),
});

export const homeCurrentlyWorkingOnSchema = z.object({
  text: z.string().min(1),
  updatedAt: z.string().min(1),
  headline: z.string().optional(),
  statusLabel: z.string().optional(),
  statusDetail: z.string().optional(),
});

export const homeCollaborationCtaSchema = z.object({
  headline: z.string().min(1),
  body: z.string(),
  href: z.string().min(1),
  secondaryHref: z.string().optional(),
  secondaryLabel: z.string().optional(),
  replyNote: z.string().optional(),
});

const expertiseTopicSchema = z.string().trim().min(1).max(80);

export const profileExpertiseSchema = z
  .object({
    domains: z.array(expertiseTopicSchema).max(12),
    methodologies: z.array(expertiseTopicSchema).max(12),
    tooling: z.array(expertiseTopicSchema).max(12),
    practices: z.array(expertiseTopicSchema).max(12),
  })
  .strict();

export const scholarlyProfilesArraySchema = z.array(scholarlyProfileLinkSchema);
export const homeHighlightsArraySchema = z.array(homeHighlightSchema);
