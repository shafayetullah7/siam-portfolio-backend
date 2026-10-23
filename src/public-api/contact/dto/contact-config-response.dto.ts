import type { PublicContactConfig } from '../../../domain/contact/contact-config.mapper';

export type ContactConfigResponse = PublicContactConfig & {
  turnstileSiteKey: string | null;
};
