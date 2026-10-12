import { describe, expect, it } from 'vitest';
import { resolveApiUrls } from '../env';

describe('resolveApiUrls', () => {
  it('falls back to localhost when undefined or empty', () => {
    expect(resolveApiUrls(undefined)).toEqual({
      API_BASE_URL: 'http://localhost:3000',
      API_PREFIX: 'http://localhost:3000/api/v1',
    });
    expect(resolveApiUrls('')).toEqual({
      API_BASE_URL: 'http://localhost:3000',
      API_PREFIX: 'http://localhost:3000/api/v1',
    });
  });

  it('resolves origin without trailing slash', () => {
    expect(resolveApiUrls('https://api.onrender.com')).toEqual({
      API_BASE_URL: 'https://api.onrender.com',
      API_PREFIX: 'https://api.onrender.com/api/v1',
    });
  });

  it('strips trailing slash from origin', () => {
    expect(resolveApiUrls('https://api.onrender.com/')).toEqual({
      API_BASE_URL: 'https://api.onrender.com',
      API_PREFIX: 'https://api.onrender.com/api/v1',
    });
  });

  it('strips trailing /api/v1 or /api/v1/ to avoid duplicate /api/v1 prefix', () => {
    expect(resolveApiUrls('https://api.onrender.com/api/v1')).toEqual({
      API_BASE_URL: 'https://api.onrender.com',
      API_PREFIX: 'https://api.onrender.com/api/v1',
    });
    expect(resolveApiUrls('https://api.onrender.com/api/v1/')).toEqual({
      API_BASE_URL: 'https://api.onrender.com',
      API_PREFIX: 'https://api.onrender.com/api/v1',
    });
  });
});
