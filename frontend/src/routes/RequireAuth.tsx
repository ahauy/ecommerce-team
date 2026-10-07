import { Navigate, Outlet, useLocation } from 'react-router-dom';
import BaseUrl from '@/consts/baseUrl';
import Loading from '@/components/ui/loading';
import { useAuthStore, type AuthRole } from '@/stores/auth.store';

interface RequireAuthProps {
  /** Chỉ cho phép role này (vd. "admin"). Bỏ trống = chỉ cần đăng nhập. */
  role?: AuthRole;
  /** Đường dẫn trang đăng nhập cho phân quyền này (vd. /admin/login, /seller/login) */
  loginPath?: string;
  /** Đường dẫn khi bị từ chối quyền (vd. /admin/login hoặc /) */
  forbiddenPath?: string;
}

const RequireAuth = ({ role, loginPath, forbiddenPath }: RequireAuthProps) => {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  // Chưa biết phiên còn hiệu lực không → chờ, tránh nháy sang /login.
  if (status === 'booting') {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center" role="status" aria-label="Đang tải">
        <Loading />
      </div>
    );
  }

  const targetLogin = loginPath || BaseUrl.Login;

  if (status === 'guest') {
    return <Navigate to={targetLogin} replace state={{ from: location }} />;
  }

  if (role && user?.role !== role) {
    return <Navigate to={forbiddenPath || BaseUrl.Homepage} replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
