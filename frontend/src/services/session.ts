import { authService } from './auth.service';
import { userService } from './user.service';
import { useAuthStore, type AuthRole } from '@/stores/auth.store';

let bootPromise: Promise<void> | null = null;

/**
 * Khôi phục phiên khi mở app: refresh-cookie → access token → /users/me.
 * Chạy đúng một lần (StrictMode / remount không gọi lại). Lỗi bất kỳ ⇒ guest.
 */
export const bootstrapSession = (): Promise<void> => {
  if (!bootPromise) {
    bootPromise = (async () => {
      const { setAccessToken, setSession, clear } = useAuthStore.getState();
      try {
        const refreshed = await authService.refresh();
        const token = refreshed.data.accessToken;
        setAccessToken(token);

        const profile = await userService.getProfile();
        const role: AuthRole = profile.role === 'admin' ? 'admin' : 'customer';
        setSession(
          { id: profile.id, email: profile.email, fullName: profile.fullName, role },
          token,
        );
      } catch {
        clear();
      }
    })();
  }
  return bootPromise;
};
