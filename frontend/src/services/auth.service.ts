import axios from 'axios';
import { AuthUser } from '@/stores/auth.store';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

export const authApiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  withCredentials: true,
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
    return response.data;
  },
};

export default authService;
