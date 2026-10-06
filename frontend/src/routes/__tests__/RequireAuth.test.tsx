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
        <Route path="/" element={<div>home page</div>} />
        <Route element={<RequireAuth />}>
          <Route path="/profile" element={<div>profile page</div>} />
        </Route>
        <Route element={<RequireAuth role="admin" />}>
          <Route path="/admin/categories" element={<div>admin page</div>} />
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
});
