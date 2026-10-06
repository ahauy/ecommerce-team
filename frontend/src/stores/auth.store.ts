import { create } from 'zustand';

export type AuthStatus = 'booting' | 'guest' | 'authed';
export type AuthRole = 'customer' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: AuthRole;
}

interface AuthState {
  /** booting: chưa biết phiên còn hiệu lực không (đang gọi /auth/refresh). */
  status: AuthStatus;
  user: AuthUser | null;
  /** Chỉ giữ trong memory — không ghi localStorage. */
  accessToken: string | null;
  setSession: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'booting',
  user: null,
  accessToken: null,
  setSession: (user, accessToken) => set({ status: 'authed', user, accessToken }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clear: () => set({ status: 'guest', user: null, accessToken: null }),
}));
