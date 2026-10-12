import axios from 'axios';
import { API_PREFIX } from '@/lib/env';
import {
  useAuthStore,
  type AuthUser,
  AUTH_TOKEN_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
  getPersistedAccessToken,
  setPersistedAccessToken,
  getPersistedUser,
  setPersistedUser,
  clearPersistedTokens,
} from '@/stores/auth.store';

export {
  AUTH_TOKEN_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
  getPersistedAccessToken,
  setPersistedAccessToken,
  getPersistedUser,
  setPersistedUser,
  clearPersistedTokens,
};

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
}

export interface RegisterResponseData {
  userId: string;
  email: string;
  fullName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponseData {
  accessToken: string;
  user: AuthUser;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: string[];
}

/**
 * Axios riêng cho /auth/*: không có interceptor refresh (tránh vòng lặp)
 * và không unwrap envelope — các hàm dưới đây trả nguyên ApiResponse<T>.
 */
export const authApiClient = axios.create({
  baseURL: API_PREFIX,
  withCredentials: true, // gửi httpOnly refresh cookie
});

export const authService = {
  async register(payload: RegisterPayload): Promise<ApiResponse<RegisterResponseData>> {
    const response = await authApiClient.post<ApiResponse<RegisterResponseData>>(
      '/auth/register',
      payload,
    );
    return response.data;
  },

  async login(payload: LoginPayload): Promise<ApiResponse<LoginResponseData>> {
    const response = await authApiClient.post<ApiResponse<LoginResponseData>>(
      '/auth/login',
      payload,
    );
    if (response.data?.data?.accessToken) {
      setPersistedAccessToken(response.data.data.accessToken);
    }
    if (response.data?.data?.user) {
      setPersistedUser(response.data.data.user);
    }
    return response.data;
  },

  async refresh(): Promise<ApiResponse<{ accessToken: string }>> {
    const response = await authApiClient.post<ApiResponse<{ accessToken: string }>>(
      '/auth/refresh',
    );
    if (response.data?.data?.accessToken) {
      setPersistedAccessToken(response.data.data.accessToken);
    }
    return response.data;
  },

  /**
   * authApiClient không có interceptor gắn token, nên phải tự gửi Bearer.
   * Thiếu header này, route /auth/logout (có guard JWT) trả 401 → cookie không bị xoá.
   * Truyền accessToken khi chưa lưu token vào store (vd. vừa login ở cổng admin).
   */
  async logout(accessToken?: string): Promise<void> {
    const token = accessToken ?? useAuthStore.getState().accessToken ?? getPersistedAccessToken();
    try {
      await authApiClient.post('/auth/logout', null, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    } finally {
      clearPersistedTokens();
    }
  },
};

export default authService;
