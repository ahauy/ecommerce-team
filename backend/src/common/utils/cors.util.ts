const DEFAULT_ALLOWED_ORIGINS = [
  'https://ecommerce-team.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

const VERCEL_ORIGIN_REGEX = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;
const LOCALHOST_ORIGIN_REGEX = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

const normalizeOrigin = (value: string): string =>
  value
    .trim()
    .replace(/^['"]+|['"]+$/g, '')
    .trim()
    .replace(/\/+$/, '');

export function isAllowedCorsOrigin(
  origin: string | undefined,
  rawFrontendUrl?: string,
): boolean {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);

  const configuredOrigins = (rawFrontendUrl ?? '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

  if (configuredOrigins.includes('*')) {
    return true;
  }

  const allowedOrigins = new Set<string>(DEFAULT_ALLOWED_ORIGINS);
  for (const entry of configuredOrigins) {
    allowedOrigins.add(entry);
    if (!/^https?:\/\//i.test(entry)) {
      allowedOrigins.add(`https://${entry}`);
    }
  }

  if (allowedOrigins.has(normalizedOrigin)) {
    return true;
  }

  if (
    VERCEL_ORIGIN_REGEX.test(normalizedOrigin) ||
    LOCALHOST_ORIGIN_REGEX.test(normalizedOrigin)
  ) {
    return true;
  }

  return false;
}
