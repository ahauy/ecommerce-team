/**
 * apiClient — Axios instance for all authenticated API calls.
 *
 * Interceptor behaviour (Option A — confirmed by user):
 *  - On 401 response: attempt POST /auth/refresh once (isRefreshing guard).
 *  - Concurrent requests that arrive while refreshing are queued and retried.
 *  - If refresh itself fails (401/403) → clear Zustand auth state + redirect /login.
 *  - No infinite loops: the guard prevents re-entry.
 */
import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { authService } from './auth.service';
import { useAuthStore } from '@/stores/auth.store';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  withCredentials: true,
});

// ── Token injection ──────────────────────────────────────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── 401 Auto-refresh with queue ──────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token),
  );
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    const status = error.response?.status;

    // Only intercept 401 on first attempt (guard against infinite loop)
    if (status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until the in-flight refresh resolves
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${token}`;
        }
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const result = await authService.refresh();
      const newToken = result.data.accessToken;

      useAuthStore.getState().setAccessToken(newToken);
      processQueue(null, newToken);

      if (originalRequest.headers) {
        (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
      }
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError as AxiosError, null);
      // Refresh failed — clear state and redirect to login
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
