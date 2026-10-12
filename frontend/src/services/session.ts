import { authService } from './auth.service';
import { userService } from './user.service';
import {
  useAuthStore,
  getPersistedAccessToken,
  loadPersistedSession,
  type AuthRole,
} from '@/stores/auth.store';

let bootPromise: Promise<void> | null = null;

/**
 * Khôi phục phiên khi mở app: ưu tiên giữ phiên từ localStorage (nếu có) + đồng bộ qua refresh / /users/me.
 * Chạy đúng một lần (StrictMode / remount không gọi lại). Lỗi bất kỳ khi chưa có phiên ⇒ guest.
 */
export const bootstrapSession = (): Promise<void> => {
  if (!bootPromise) {
    bootPromise = (async () => {
      const { setAccessToken, setSession, clear } = useAuthStore.getState();
      const persisted = loadPersistedSession();
      if (persisted.user && persisted.accessToken) {
        setSession(persisted.user, persisted.accessToken);
      }

      let token: string | null = persisted.accessToken;
      if (!token) {
        try {
          const refreshed = await authService.refresh();
          token = refreshed.data.accessToken;
        } catch {
          token = getPersistedAccessToken?.() ?? null;
        }
      }

      if (!token) {
        if (useAuthStore.getState().status !== 'authed') {
          clear();
        }
        return;
      }

      try {
        setAccessToken(token);
        const profile = await userService.getProfile();
        const role: AuthRole = profile.role === 'admin' ? 'admin' : 'customer';
        setSession(
          { id: profile.id, email: profile.email, fullName: profile.fullName, role },
          token,
        );
      } catch (err) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (!persisted.user || status === 401 || status === 403) {
          clear();
        }
      }
    })();
  }
  return bootPromise;
};
