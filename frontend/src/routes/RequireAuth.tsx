import { Navigate, Outlet, useLocation } from 'react-router-dom';
import BaseUrl from '@/consts/baseUrl';
import Loading from '@/components/ui/loading';
import { useAuthStore, type AuthRole } from '@/stores/auth.store';

interface RequireAuthProps {
  /** Chỉ cho phép role này (vd. "admin"). Bỏ trống = chỉ cần đăng nhập. */
  role?: AuthRole;
}

const RequireAuth = ({ role }: RequireAuthProps) => {
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

  if (status === 'guest') {
    return <Navigate to={BaseUrl.Login} replace state={{ from: location }} />;
  }

  if (role && user?.role !== role) {
    return <Navigate to={BaseUrl.Homepage} replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
