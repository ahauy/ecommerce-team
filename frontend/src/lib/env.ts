const DEFAULT_API_BASE_URL = 'http://localhost:3000';

export function resolveApiUrls(rawUrl?: string): {
  API_BASE_URL: string;
  API_PREFIX: string;
} {
  const base = (rawUrl?.trim() || DEFAULT_API_BASE_URL)
    .replace(/\/+$/, '')
    .replace(/\/api\/v1$/, '');
  return {
    API_BASE_URL: base,
    API_PREFIX: `${base}/api/v1`,
  };
}

export const { API_BASE_URL, API_PREFIX } = resolveApiUrls(
  import.meta.env.VITE_API_URL,
);

