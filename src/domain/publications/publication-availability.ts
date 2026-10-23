import type { PublicationRow } from './publications.types';

export type PublicationAvailabilityLabel =
  | 'open_access'
  | 'publisher_link'
  | 'no_pdf';

function hasText(value: string | null | undefined): boolean {
  return (value?.trim() ?? '').length > 0;
}

export function availabilityForPublication(
  row: PublicationRow,
  options: { pdfHref?: string | null } = {},
): PublicationAvailabilityLabel {
  const pdfHref = options.pdfHref?.trim();
  if (pdfHref || row.pdfMediaId || row.openAccess) {
    return 'open_access';
  }
  if (hasText(row.doi) || hasText(row.publisherUrl)) {
    return 'publisher_link';
  }
  return 'no_pdf';
}
