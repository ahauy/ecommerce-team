import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RequireAuth from '../RequireAuth';
import { useAuthStore } from '@/stores/auth.store';

const customer = { id: 'u1', email: 'a@b.c', fullName: 'An', role: 'customer' as const };
const admin = { ...customer, id: 'u2', role: 'admin' as const };

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>login page</div>} />
        <Route path="/seller/login" element={<div>seller login page</div>} />
        <Route path="/admin/login" element={<div>admin login page</div>} />
        <Route path="/admin/profile" element={<div>admin profile page</div>} />
        <Route path="/" element={<div>home page</div>} />
        <Route element={<RequireAuth />}>
          <Route path="/profile" element={<div>profile page</div>} />
        </Route>
        <Route element={<RequireAuth role="admin" />}>
          <Route path="/admin/categories" element={<div>admin page</div>} />
        </Route>
        <Route element={<RequireAuth role="admin" loginPath="/admin/login" />}>
          <Route path="/admin/users" element={<div>admin users page</div>} />
        </Route>
        <Route
          element={
            <RequireAuth role="customer" loginPath="/seller/login" forbiddenPath="/admin/profile" />
          }
        >
          <Route path="/seller/products" element={<div>seller page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe('RequireAuth', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'booting', user: null, accessToken: null });
  });

  it('shows a loader (no redirect flash) while booting', () => {
    renderAt('/profile');
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('login page')).not.toBeInTheDocument();
    expect(screen.queryByText('profile page')).not.toBeInTheDocument();
  });

  it('redirects guests to /login', () => {
    useAuthStore.getState().clear();
    renderAt('/profile');
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('lets an authenticated user through', () => {
    useAuthStore.getState().setSession(customer, 't');
    renderAt('/profile');
    expect(screen.getByText('profile page')).toBeInTheDocument();
  });

  it('blocks a customer from admin routes (redirects home)', () => {
    useAuthStore.getState().setSession(customer, 't');
    renderAt('/admin/categories');
    expect(screen.getByText('home page')).toBeInTheDocument();
    expect(screen.queryByText('admin page')).not.toBeInTheDocument();
  });

  it('lets an admin into admin routes', () => {
    useAuthStore.getState().setSession(admin, 't');
    renderAt('/admin/categories');
    expect(screen.getByText('admin page')).toBeInTheDocument();
  });

  it('redirects a guest away from admin routes to /login', () => {
    useAuthStore.getState().clear();
    renderAt('/admin/categories');
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('redirects a guest from /admin/* to the admin login portal', () => {
    useAuthStore.getState().clear();
    renderAt('/admin/users');
    expect(screen.getByText('admin login page')).toBeInTheDocument();
  });

  it('redirects a guest from /seller/* to the seller login portal', () => {
    useAuthStore.getState().clear();
    renderAt('/seller/products');
    expect(screen.getByText('seller login page')).toBeInTheDocument();
  });

  it('lets a customer into seller routes', () => {
    useAuthStore.getState().setSession(customer, 't');
    renderAt('/seller/products');
    expect(screen.getByText('seller page')).toBeInTheDocument();
  });

  it('sends an admin away from seller routes to forbiddenPath', () => {
    useAuthStore.getState().setSession(admin, 't');
    renderAt('/seller/products');
    expect(screen.getByText('admin profile page')).toBeInTheDocument();
    expect(screen.queryByText('seller page')).not.toBeInTheDocument();
  });
});
