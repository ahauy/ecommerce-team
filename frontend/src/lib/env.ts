export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const API_PREFIX = `${API_BASE_URL}/api/v1`;
