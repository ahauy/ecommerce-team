import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'customer' | 'admin';
  shopName: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isLogged: boolean;
  setAuth: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLogged: false,
  setAuth: (user, accessToken) =>
    set({
      user,
      accessToken,
      isLogged: true,
    }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clearAuth: () =>
    set({
      user: null,
      accessToken: null,
      isLogged: false,
    }),
}));
