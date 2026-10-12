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

export const AUTH_TOKEN_STORAGE_KEY = 'teamshop_access_token';
export const AUTH_USER_STORAGE_KEY = 'teamshop_auth_user';

export const getPersistedAccessToken = (): string | null => {
  try {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setPersistedAccessToken = (token: string | null): void => {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
};

export const getPersistedUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (parsed && typeof parsed.id === 'string' && typeof parsed.email === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

export const setPersistedUser = (user: AuthUser | null): void => {
  try {
    if (user) {
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
};

export const loadPersistedSession = (): {
  user: AuthUser | null;
  accessToken: string | null;
} => ({
  user: getPersistedUser(),
  accessToken: getPersistedAccessToken(),
});

export const clearPersistedTokens = (): void => {
  try {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
};

const initialSession = loadPersistedSession();
const hasPersistedSession = Boolean(initialSession.user && initialSession.accessToken);

export const useAuthStore = create<AuthState>((set) => ({
  status: hasPersistedSession ? 'authed' : 'booting',
  user: hasPersistedSession ? initialSession.user : null,
  accessToken: hasPersistedSession ? initialSession.accessToken : null,
  setSession: (user, accessToken) => {
    setPersistedUser(user);
    setPersistedAccessToken(accessToken);
    set({ status: 'authed', user, accessToken });
  },
  setAccessToken: (accessToken) => {
    setPersistedAccessToken(accessToken);
    set({ accessToken });
  },
  clear: () => {
    clearPersistedTokens();
    set({ status: 'guest', user: null, accessToken: null });
  },
}));
