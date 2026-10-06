/**
 * Vietnamese slug transliteration helper
 * Mirroring backend slugifyVietnamese logic for live preview in drawer
 */
export function slugifyVietnamese(text: string): string {
  if (!text) return '';

  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}
