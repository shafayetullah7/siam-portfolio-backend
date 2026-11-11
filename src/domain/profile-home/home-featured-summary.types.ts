import type { FEATURED_ON_HOME_CAPS } from './featured-on-home.constants';

export type HomeFeaturedKind = 'research' | 'publication' | 'project';

export type HomeFeaturedSummaryItem = {
  id: string;
  slug: string;
  title: string;
  publishStatus: string;
  kind: HomeFeaturedKind;
  appearsOnPublicHome: boolean;
};

export type HomeFeaturedSummaryResponse = {
  caps: typeof FEATURED_ON_HOME_CAPS;
  research: HomeFeaturedSummaryItem[];
  publications: HomeFeaturedSummaryItem[];
  projects: HomeFeaturedSummaryItem[];
};
