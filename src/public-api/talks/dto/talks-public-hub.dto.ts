import type { TalkPublicCard } from '../../../domain/talks/talks.types';

export type TalksPublicHubDto = {
  intro: string | null;
  upcoming: TalkPublicCard[];
  past: TalkPublicCard[];
};
