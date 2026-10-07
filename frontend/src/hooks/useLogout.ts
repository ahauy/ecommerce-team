import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import BaseUrl from '@/consts/baseUrl';
import authService from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { queryClient } from '@/lib/queryClient';

/** Cổng đăng nhập tương ứng với khu vực người dùng đang đứng. */
export const getLoginPathFor = (pathname: string): string => {
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return BaseUrl.AdminLogin;
  if (pathname === '/seller' || pathname.startsWith('/seller/')) return BaseUrl.SellerLogin;
  return BaseUrl.Login;
};

/**
 * Đăng xuất đúng nghĩa: thu hồi refresh-cookie phía BE, rồi xoá state + cache phía FE.
 * Dù gọi BE lỗi (mất mạng...) vẫn đăng xuất phía client.
 * Sau khi thoát, quay về cổng đăng nhập của khu vực hiện tại (Admin / Seller / Buyer).
 */
export const useLogout = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return useCallback(async () => {
    const loginPath = getLoginPathFor(pathname);
    try {
      await authService.logout();
    } catch {
      // Vẫn xoá phiên cục bộ, nhưng báo để biết cookie phía server có thể chưa bị thu hồi.
      toast.warn('Không thể thu hồi phiên trên máy chủ. Vui lòng kiểm tra kết nối.');
    }
    useAuthStore.getState().clear();
    queryClient.clear();
    navigate(loginPath, { replace: true });
  }, [navigate, pathname]);
};

export default useLogout;
