import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AxiosError } from 'axios';

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));
vi.mock('../auth.service', () => ({
  authService: { refresh: refreshMock },
  default: { refresh: refreshMock },
}));

import { apiClient } from '../apiClient';
import { useAuthStore } from '@/stores/auth.store';

const user = { id: 'u1', email: 'a@b.c', fullName: 'An', role: 'customer' as const };

const ok = (config: InternalAxiosRequestConfig, data: unknown): AxiosResponse => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config,
});

const fail = (config: InternalAxiosRequestConfig, status: number): AxiosError =>
  new AxiosError('fail', String(status), config, null, {
    data: {},
    status,
    statusText: '',
    headers: {},
    config,
  } as AxiosResponse);

const authHeader = (config: InternalAxiosRequestConfig) =>
  (config.headers as unknown as { get(n: string): string | undefined }).get('Authorization');

/** Server giả: chỉ chấp nhận "Bearer fresh". */
const installAdapter = (calls: string[] = []) => {
  const adapter: AxiosAdapter = async (config) => {
    calls.push(`${config.url}|${authHeader(config)}`);
    if (authHeader(config) === 'Bearer fresh') {
      return ok(config, { success: true, data: { url: config.url }, message: 'ok' });
    }
    throw fail(config, 401);
  };
  apiClient.defaults.adapter = adapter;
  return calls;
};

describe('apiClient', () => {
  beforeEach(() => {
    refreshMock.mockReset();
    useAuthStore.getState().setSession(user, 'stale');
  });

  it('attaches the in-memory bearer token', async () => {
    const calls: string[] = [];
    apiClient.defaults.adapter = async (config) => {
      calls.push(String(authHeader(config)));
      return ok(config, {});
    };
    await apiClient.get('/x');
    expect(calls).toEqual(['Bearer stale']);
  });

  it('unwraps the { success, data } envelope', async () => {
    apiClient.defaults.adapter = async (config) =>
      ok(config, { success: true, data: [1, 2], message: 'ok' });
    const res = await apiClient.get('/x');
    expect(res.data).toEqual([1, 2]);
  });

  it('leaves non-envelope bodies untouched', async () => {
    apiClient.defaults.adapter = async (config) => ok(config, { id: 1, success: true });
    const res = await apiClient.get('/x');
    expect(res.data).toEqual({ id: 1, success: true });
  });

  it('on 401 refreshes once and retries with the new token', async () => {
    refreshMock.mockResolvedValue({ data: { accessToken: 'fresh' } });
    const calls = installAdapter();

    const res = await apiClient.get('/a');

    expect(res.data).toEqual({ url: '/a' });
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(['/a|Bearer stale', '/a|Bearer fresh']);
    expect(useAuthStore.getState().accessToken).toBe('fresh');
    expect(useAuthStore.getState().status).toBe('authed');
  });

  it('concurrent 401s share a single refresh (queue)', async () => {
    let release!: () => void;
    refreshMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ data: { accessToken: 'fresh' } });
        }),
    );
    installAdapter();

    const all = Promise.all([apiClient.get('/a'), apiClient.get('/b'), apiClient.get('/c')]);
    await vi.waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
    release();
    const results = await all;

    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(results.map((r) => r.data.url).sort()).toEqual(['/a', '/b', '/c']);
  });

  it('when refresh fails: clears the session, rejects, and does not redirect', async () => {
    refreshMock.mockRejectedValue(new Error('refresh expired'));
    installAdapter();
    const hrefBefore = window.location.href;

    await expect(apiClient.get('/a')).rejects.toThrow('refresh expired');

    expect(useAuthStore.getState().status).toBe('guest');
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(window.location.href).toBe(hrefBefore);
  });

  it('rejects queued requests too when refresh fails', async () => {
    let failRefresh!: () => void;
    refreshMock.mockImplementation(
      () =>
        new Promise((_, reject) => {
          failRefresh = () => reject(new Error('nope'));
        }),
    );
    installAdapter();

    const settled = Promise.allSettled([apiClient.get('/a'), apiClient.get('/b')]);
    await vi.waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
    failRefresh();

    const results = await settled;
    expect(results.every((r) => r.status === 'rejected')).toBe(true);
  });

  it('a non-401 failure of the retried request does NOT log the user out', async () => {
    refreshMock.mockResolvedValue({ data: { accessToken: 'fresh' } });
    apiClient.defaults.adapter = async (config) => {
      if (authHeader(config) === 'Bearer fresh') throw fail(config, 500);
      throw fail(config, 401);
    };

    await expect(apiClient.get('/a')).rejects.toMatchObject({ response: { status: 500 } });

    expect(useAuthStore.getState().status).toBe('authed');
    expect(useAuthStore.getState().accessToken).toBe('fresh');
  });

  it('does not loop when the retried request is still 401', async () => {
    refreshMock.mockResolvedValue({ data: { accessToken: 'still-bad' } });
    installAdapter();

    await expect(apiClient.get('/a')).rejects.toMatchObject({ response: { status: 401 } });
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });
});
