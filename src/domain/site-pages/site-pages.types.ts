export type CreateSitePageInput = {
  slug: string;
  title: string;
  body?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export type UpdateSitePageInput = Partial<CreateSitePageInput>;
