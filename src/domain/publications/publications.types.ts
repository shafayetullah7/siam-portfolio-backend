import type { PublishStatus } from '../../common/publishing/publish-status';
import type { publicationAuthors } from '../../db/schema/publication-authors';
import type { publicationSupplements } from '../../db/schema/publication-supplements';
import type { PublicationAuthorInput } from './publication-authors';
import type { PublicationSupplementInput } from './publication-supplements';
import type { PublicationAvailabilityLabel } from './publication-availability';

export type { PublicationAuthorInput } from './publication-authors';
export type { PublicationSupplementInput } from './publication-supplements';
import type { publications } from '../../db/schema/publications';

export type PublicationRow = typeof publications.$inferSelect;
export type PublicationAuthorRow = typeof publicationAuthors.$inferSelect;
export type PublicationSupplementRow =
  typeof publicationSupplements.$inferSelect;

export type PublicationAuthor = {
  sortOrder: number;
  name: string;
  affiliation?: string;
  orcid?: string;
};

export type PublicationAuthorPublic = {
  name: string;
  affiliation?: string;
  orcid?: string;
};
export type PublicationType = PublicationRow['publicationType'];

export type ListAdminPublicationsQuery = {
  q?: string;
  publishStatus?: PublishStatus;
  year?: number;
  publicationType?: PublicationType;
  limit?: number;
};

export type ListPublishedPublicationsQuery = {
  q?: string;
  year?: number;
  publicationType?: PublicationType;
  themeSlug?: string;
  page?: number;
  limit?: number;
};

export type PublicationSupplement = {
  sortOrder: number;
  label: string;
  url: string;
  kind: PublicationSupplementRow['kind'];
};

export type PublicationSupplementPublic = {
  label: string;
  url: string;
  kind: PublicationSupplementRow['kind'];
};

export type PublicationPublicCard = {
  slug: string;
  title: string;
  authorsShort: string;
  year: number;
  venue: string;
  publicationType: PublicationType;
  featured: boolean;
  significance?: string;
  doi?: string;
  href: string;
  availability: PublicationAvailabilityLabel;
};

export type PublicationPublicDetail = PublicationPublicCard & {
  abstract?: string;
  peerReviewed: boolean;
  doi?: string;
  publisherUrl?: string;
  ownerContribution?: string;
  correctionNotice?: string;
  seoTitle?: string;
  seoDescription?: string;
  authors?: PublicationAuthorPublic[];
  supplements?: PublicationSupplementPublic[];
  pdfHref?: string;
};

export type CreatePublicationInput = {
  slug: string;
  title: string;
  authors: PublicationAuthorInput[];
  year: number;
  venue: string;
  significance?: string | null;
  abstract?: string | null;
  publicationType?: PublicationType;
  peerReviewed?: boolean;
  doi?: string | null;
  publisherUrl?: string | null;
  featured?: boolean;
  featuredOnHome?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ownerContribution?: string | null;
  correctionNotice?: string | null;
  hideFromSearch?: boolean;
  supplements?: PublicationSupplementInput[];
  pdfMediaId?: string | null;
  openAccess?: boolean;
  pdfRightsGranted?: boolean;
};

export type UpdatePublicationInput = Partial<CreatePublicationInput>;

export type PublicationPdfMediaSummary = {
  id: string;
  fileName: string;
  url: string;
};
