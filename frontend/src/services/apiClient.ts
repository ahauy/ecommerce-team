/**
 * apiClient — Axios instance cho mọi request cần (hoặc có thể cần) access token.
 *
 *  - Request: gắn Bearer token lấy từ auth store (token chỉ nằm trong memory).
 *  - Response thành công: bóc envelope { success, data, message } → res.data = data.
 *  - 401: gọi POST /auth/refresh đúng một lần; các request đến trong lúc đang
 *    refresh được xếp hàng rồi retry với token mới.
 *  - Refresh thất bại: xoá phiên + cache. Không redirect cứng — RequireAuth
 *    tự đưa người dùng về /login nếu đang ở route cần đăng nhập, còn route
 *    public (trang chủ, shop) vẫn xem được như Guest.
 */
import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { authService } from './auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { queryClient } from '@/lib/queryClient';
import { API_PREFIX } from '@/lib/env';

export const apiClient = axios.create({
  baseURL: API_PREFIX,
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

// ── Unwrap envelope { success, data, message } ───────────────────────────────
apiClient.interceptors.response.use((res) => {
  const body = res.data;
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    res.data = body.data;
  }
  return res;
});

// ── 401 auto-refresh with queue ──────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error || !token ? reject(error) : resolve(token),
  );
  failedQueue = [];
};

type RetriableConfig = AxiosRequestConfig & { _retry?: boolean };

const withToken = (config: RetriableConfig, token: string): RetriableConfig => ({
  ...config,
  headers: { ...config.headers, Authorization: `Bearer ${token}` },
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => apiClient(withToken({ ...originalRequest, _retry: true }, token)));
    }

    isRefreshing = true;

    let newToken: string;
    try {
      const result = await authService.refresh();
      newToken = result.data.accessToken;
      useAuthStore.getState().setAccessToken(newToken);
      processQueue(null, newToken);
    } catch (refreshError) {
      processQueue(refreshError, null);
      useAuthStore.getState().clear();
      queryClient.clear();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }

    // Retry nằm ngoài try/catch: lỗi của chính request này không được coi là refresh thất bại.
    return apiClient(withToken({ ...originalRequest, _retry: true }, newToken));
  },
);

export default apiClient;
