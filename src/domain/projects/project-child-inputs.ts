import { BadRequestException } from '@nestjs/common';
import type {
  ProjectResourceType,
  ProjectSectionKind,
  ProjectSectionRow,
  ProjectResourceRow,
  ProjectMetricRow,
} from './projects.types';

export type ProjectSectionWrite = {
  kind?: ProjectSectionKind;
  title?: string | null;
  body: string;
  mediaIds?: string[];
};

export type ProjectResourceWrite = {
  resourceType?: ProjectResourceType;
  label: string;
  url: string;
};

export type ProjectMetricWrite = {
  name: string;
  value: string;
  unit?: string | null;
  baseline?: string | null;
  notes?: string | null;
  caption?: string | null;
};

export type NormalizedProjectSection = {
  sortOrder: number;
  kind: ProjectSectionKind;
  title: string | null;
  body: string;
  mediaIds: string[];
};

export type NormalizedProjectResource = {
  sortOrder: number;
  resourceType: ProjectResourceType;
  label: string;
  url: string;
};

export type NormalizedProjectMetric = {
  sortOrder: number;
  name: string;
  value: string;
  unit: string | null;
  baseline: string | null;
  notes: string | null;
  caption: string | null;
};

const HTTPS_URL = /^https:\/\/.+/i;
const MAX_SECTIONS = 40;
const MAX_SECTION_FIGURES = 5;
const MAX_RESOURCES = 20;
const MAX_METRICS = 30;

function trimOptional(value: string | null | undefined): string | null {
  if (value == null) return null;
  const t = value.trim();
  return t === '' ? null : t;
}

export function normalizeSectionInputs(
  sections: ProjectSectionWrite[],
): NormalizedProjectSection[] {
  if (sections.length > MAX_SECTIONS) {
    throw new BadRequestException(`At most ${MAX_SECTIONS} sections allowed`);
  }
  const normalized: NormalizedProjectSection[] = [];
  for (const row of sections) {
    const body = row.body?.trim() ?? '';
    const kind = row.kind ?? 'custom';
    const title = trimOptional(row.title);
    if (kind === 'custom' && !title) {
      throw new BadRequestException('Custom sections require a title');
    }
    if (!body && kind !== 'custom') {
      continue;
    }
    const mediaIds = normalizeSectionMediaIds(row.mediaIds);
    normalized.push({
      sortOrder: normalized.length,
      kind,
      title,
      body,
      mediaIds,
    });
  }
  return normalized;
}

function normalizeSectionMediaIds(mediaIds: string[] | undefined): string[] {
  if (!mediaIds?.length) return [];
  if (mediaIds.length > MAX_SECTION_FIGURES) {
    throw new BadRequestException(
      `At most ${MAX_SECTION_FIGURES} figures per section allowed`,
    );
  }
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const id of mediaIds) {
    const trimmed = id.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    unique.push(trimmed);
  }
  return unique;
}

export function normalizeResourceInputs(
  resources: ProjectResourceWrite[],
): NormalizedProjectResource[] {
  if (resources.length > MAX_RESOURCES) {
    throw new BadRequestException(`At most ${MAX_RESOURCES} resources allowed`);
  }
  const normalized: NormalizedProjectResource[] = [];
  for (const row of resources) {
    const label = row.label?.trim() ?? '';
    const url = row.url?.trim() ?? '';
    if (!label && !url) continue;
    if (!label || !url) {
      throw new BadRequestException(
        'Each resource must have both a label and a URL',
      );
    }
    if (!HTTPS_URL.test(url)) {
      throw new BadRequestException('Resource URLs must use https://');
    }
    normalized.push({
      sortOrder: normalized.length,
      resourceType: row.resourceType ?? 'other',
      label,
      url,
    });
  }
  return normalized;
}

export function normalizeMetricInputs(
  metrics: ProjectMetricWrite[],
): NormalizedProjectMetric[] {
  if (metrics.length > MAX_METRICS) {
    throw new BadRequestException(`At most ${MAX_METRICS} metrics allowed`);
  }
  const normalized: NormalizedProjectMetric[] = [];
  for (const row of metrics) {
    const name = row.name?.trim() ?? '';
    const value = row.value?.trim() ?? '';
    if (!name && !value) continue;
    if (!name || !value) {
      throw new BadRequestException(
        'Each metric must have both a name and a value',
      );
    }
    normalized.push({
      sortOrder: normalized.length,
      name,
      value,
      unit: trimOptional(row.unit),
      baseline: trimOptional(row.baseline),
      notes: trimOptional(row.notes),
      caption: trimOptional(row.caption),
    });
  }
  return normalized;
}

export function mapSectionsToAdmin(
  rows: ProjectSectionRow[],
  mediaBySectionId: Map<string, string[]> = new Map(),
) {
  return rows
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((row) => ({
      sortOrder: row.sortOrder,
      kind: row.kind,
      title: row.title,
      body: row.body,
      ...(mediaBySectionId.get(row.id)?.length
        ? { mediaIds: mediaBySectionId.get(row.id) }
        : {}),
    }));
}

export function mapResourcesToAdmin(rows: ProjectResourceRow[]) {
  return rows
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((row) => ({
      sortOrder: row.sortOrder,
      resourceType: row.resourceType,
      label: row.label,
      url: row.url,
    }));
}

export function mapMetricsToAdmin(rows: ProjectMetricRow[]) {
  return rows
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((row) => ({
      sortOrder: row.sortOrder,
      name: row.name,
      value: row.value,
      unit: row.unit,
      baseline: row.baseline,
      notes: row.notes,
      caption: row.caption,
    }));
}
