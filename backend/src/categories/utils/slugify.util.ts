/**
 * Vietnamese Slugify Helper
 * Converts Vietnamese text to URL-friendly lowercase kebab-case slug.
 * Follows The Ladder of Minimal Code (Native JS regex & normalization).
 */
export function slugifyVietnamese(text: string): string {
  if (!text) {
    return '';
  }

  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
