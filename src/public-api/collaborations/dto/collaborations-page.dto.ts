import type { CollaborationPublicCard } from '../../../domain/talks/talks.types';
import type { AcademicServicePublicRow } from '../../../domain/talks/talks.types';

export type CollaborationsPageDto = {
  pageEnabled: boolean;
  intro: string | null;
  collaborations: CollaborationPublicCard[];
  service: AcademicServicePublicRow[];
};
