import type { ProjectPublicCard } from '../../../domain/projects/projects.types';
import type { PublicationPublicCard } from '../../../domain/publications/publications.types';
import type { ResearchThemePublicLinkCard } from '../../../domain/research/research.types';
import type {
  TalkPublicCard,
  TalkPublicResource,
} from '../../../domain/talks/talks.types';

export type TalkPublicRelated = {
  publications: PublicationPublicCard[];
  projects: ProjectPublicCard[];
  themes: ResearchThemePublicLinkCard[];
};

export type TalkPublicDetailDto = TalkPublicCard & {
  endsAt?: string | null;
  resources: TalkPublicResource[];
  related: TalkPublicRelated;
};
