/**
 * Auth Contracts for US-AUTH-001 (auth-register-login)
 */

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
}

export interface RegisterResponseData {
  userId: string;
  email: string;
  fullName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthUserData {
  id: string;
  email: string;
  fullName: string;
  role: "customer" | "admin";
  shopName: string | null;
}

export interface LoginResponseData {
  accessToken: string;
  user: AuthUserData;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  errors?: string[];
}
