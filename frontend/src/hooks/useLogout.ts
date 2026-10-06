import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BaseUrl from '@/consts/baseUrl';
import authService from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { queryClient } from '@/lib/queryClient';

/**
 * Đăng xuất đúng nghĩa: thu hồi refresh-cookie phía BE, rồi xoá state + cache phía FE.
 * Dù gọi BE lỗi (mất mạng...) vẫn đăng xuất phía client.
 */
export const useLogout = () => {
  const navigate = useNavigate();

  return useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // bỏ qua — vẫn xoá phiên cục bộ
    }
    useAuthStore.getState().clear();
    queryClient.clear();
    navigate(BaseUrl.Login, { replace: true });
  }, [navigate]);
};

export default useLogout;
