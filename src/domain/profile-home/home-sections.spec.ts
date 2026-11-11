import { describe, expect, it } from 'vitest';
import { HOME_SECTION_IDS } from './home-section-ids';
import {
  DEFAULT_HOME_SECTIONS,
  normalizeHomeSections,
  resolveVisibleSectionIds,
} from './home-sections';

describe('DEFAULT_HOME_SECTIONS', () => {
  it('includes every canonical section id once', () => {
    expect(DEFAULT_HOME_SECTIONS).toHaveLength(HOME_SECTION_IDS.length);
    expect(DEFAULT_HOME_SECTIONS.map((s) => s.id)).toEqual([...HOME_SECTION_IDS]);
    expect(DEFAULT_HOME_SECTIONS.every((s) => s.visible)).toBe(true);
  });
});

describe('normalizeHomeSections', () => {
  it('rejects unknown section ids', () => {
    expect(() =>
      normalizeHomeSections([{ id: 'hero', visible: true }, { id: 'unknown', visible: true }]),
    ).toThrow(/unknown section id/i);
  });

  it('rejects duplicate section ids', () => {
    expect(() =>
      normalizeHomeSections([
        { id: 'hero', visible: true },
        { id: 'hero', visible: true },
      ]),
    ).toThrow(/duplicate/i);
  });

  it('requires hero visible', () => {
    expect(() =>
      normalizeHomeSections([{ id: 'hero', visible: false }]),
    ).toThrow(/hero/i);
  });

  it('preserves input order after validation', () => {
    const normalized = normalizeHomeSections([
      { id: 'collaborationCta', visible: true },
      { id: 'hero', visible: true },
      { id: 'researchFocus', visible: true },
    ]);
    expect(normalized.map((s) => s.id)).toEqual([
      'collaborationCta',
      'hero',
      'researchFocus',
    ]);
  });
});

describe('resolveVisibleSectionIds', () => {
  it('omits sections with visible false', () => {
    expect(
      resolveVisibleSectionIds([
        { id: 'hero', visible: true },
        { id: 'researchFocus', visible: false },
        { id: 'featuredProjects', visible: true },
      ]),
    ).toEqual(['hero', 'featuredProjects']);
  });
});
