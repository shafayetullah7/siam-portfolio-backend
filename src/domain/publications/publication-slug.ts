/** URL-safe slug from a display title (mirrors siam-frontend slugFromTitle). */
export function slugFromTitle(title: string): string {
  const normalized = title
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return normalized.slice(0, 200);
}
