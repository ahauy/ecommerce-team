import { isAllowedCorsOrigin } from '../cors.util';

describe('isAllowedCorsOrigin', () => {
  it('allows requests with undefined origin (server-to-server / webhook / curl)', () => {
    expect(isAllowedCorsOrigin(undefined)).toBe(true);
  });

  it('allows https://ecommerce-team.vercel.app even when FRONTEND_URL is undefined', () => {
    expect(isAllowedCorsOrigin('https://ecommerce-team.vercel.app')).toBe(true);
  });

  it('allows Vercel preview URLs matching *.vercel.app', () => {
    expect(
      isAllowedCorsOrigin('https://ecommerce-team-git-main-ahauy.vercel.app'),
    ).toBe(true);
  });

  it('allows localhost origins on any port', () => {
    expect(isAllowedCorsOrigin('http://localhost:5173')).toBe(true);
    expect(isAllowedCorsOrigin('http://127.0.0.1:4173')).toBe(true);
  });

  it('allows custom origins from FRONTEND_URL with quotes, trailing slashes, or missing https://', () => {
    const rawFrontendUrl =
      'https://custom.domain.com/, \'https://second.domain.com\', bare.domain.com';
    expect(isAllowedCorsOrigin('https://custom.domain.com', rawFrontendUrl)).toBe(
      true,
    );
    expect(isAllowedCorsOrigin('https://second.domain.com', rawFrontendUrl)).toBe(
      true,
    );
    expect(isAllowedCorsOrigin('https://bare.domain.com', rawFrontendUrl)).toBe(
      true,
    );
  });

  it('rejects unknown third-party origins', () => {
    expect(
      isAllowedCorsOrigin(
        'https://evil.example.com',
        'https://ecommerce-team.vercel.app',
      ),
    ).toBe(false);
  });
});
