import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import {
  HOME_SECTION_IDS,
  isHomeSectionId,
  MAX_HOME_SECTIONS,
  type HomeSectionId,
} from './home-section-ids';
import type { HomeSectionConfig } from './profile-home.types';

const homeSectionConfigSchema = z.object({
  id: z.string(),
  visible: z.boolean(),
});

export const homeSectionConfigArraySchema = z.array(homeSectionConfigSchema);

export const DEFAULT_HOME_SECTIONS: HomeSectionConfig[] = HOME_SECTION_IDS.map(
  (id) => ({ id, visible: true }),
);

export function normalizeHomeSections(input: unknown): HomeSectionConfig[] {
  const parsed = homeSectionConfigArraySchema.safeParse(input);
  if (!parsed.success) {
    throw new BadRequestException('sections must be an array of { id, visible }');
  }
  const sections = parsed.data;
  if (sections.length > MAX_HOME_SECTIONS) {
    throw new BadRequestException(
      `sections must have at most ${MAX_HOME_SECTIONS} entries`,
    );
  }

  const seen = new Set<string>();
  for (const section of sections) {
    if (!isHomeSectionId(section.id)) {
      throw new BadRequestException(`unknown section id: ${section.id}`);
    }
    if (seen.has(section.id)) {
      throw new BadRequestException(`duplicate section id: ${section.id}`);
    }
    seen.add(section.id);
  }

  const hero = sections.find((s) => s.id === 'hero');
  if (!hero) {
    throw new BadRequestException('sections must include hero');
  }
  if (!hero.visible) {
    throw new BadRequestException('hero section cannot be hidden');
  }

  return sections.map((s) => ({
    id: s.id as HomeSectionId,
    visible: s.visible,
  }));
}

export function resolveVisibleSectionIds(
  sections: HomeSectionConfig[],
): HomeSectionId[] {
  return sections.filter((s) => s.visible).map((s) => s.id);
}

/** DB JSON rows use plain `string` section ids — normalize to typed `HomeSectionConfig`. */
export function sectionsOrDefault(stored: unknown): HomeSectionConfig[] {
  if (!Array.isArray(stored) || stored.length === 0) {
    return DEFAULT_HOME_SECTIONS;
  }
  try {
    return normalizeHomeSections(stored);
  } catch {
    return DEFAULT_HOME_SECTIONS;
  }
}
