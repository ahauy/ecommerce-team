import { renderHook, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

const { logoutMock } = vi.hoisted(() => ({ logoutMock: vi.fn() }));
vi.mock('@/services/auth.service', () => ({
  authService: { logout: logoutMock },
  default: { logout: logoutMock },
}));

import useLogout, { getLoginPathFor } from '../useLogout';
import { useAuthStore } from '@/stores/auth.store';
import { queryClient } from '@/lib/queryClient';

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;
const user = { id: 'u1', email: 'a@b.c', fullName: 'An', role: 'customer' as const };

describe('useLogout', () => {
  beforeEach(() => {
    logoutMock.mockReset();
    useAuthStore.getState().setSession(user, 'tok');
    queryClient.setQueryData(['user', 'profile'], { id: 'u1' });
  });

  it('calls the backend, clears the session and the query cache', async () => {
    logoutMock.mockResolvedValue(undefined);
    const { result } = renderHook(() => useLogout(), { wrapper });

    await act(async () => {
      await result.current();
    });

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().status).toBe('guest');
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(queryClient.getQueryData(['user', 'profile'])).toBeUndefined();
  });

  it('still logs out locally when the backend call fails', async () => {
    logoutMock.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useLogout(), { wrapper });

    await act(async () => {
      await result.current();
    });

    expect(useAuthStore.getState().status).toBe('guest');
  });

  describe('getLoginPathFor', () => {
    it('maps each area to its own login portal', () => {
      expect(getLoginPathFor('/admin/categories')).toBe('/admin/login');
      expect(getLoginPathFor('/admin')).toBe('/admin/login');
      expect(getLoginPathFor('/seller/products/new')).toBe('/seller/login');
      expect(getLoginPathFor('/account/profile')).toBe('/login');
      expect(getLoginPathFor('/')).toBe('/login');
    });
  });

  it('navigates to the admin portal after logging out from /admin/*', async () => {
    logoutMock.mockResolvedValue(undefined);
    const LocationProbe = () => <div data-testid="loc">{useLocation().pathname}</div>;
    const adminWrapper = ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={['/admin/categories']}>
        <Routes>
          <Route path="*" element={<>{children}<LocationProbe /></>} />
        </Routes>
      </MemoryRouter>
    );
    const { result } = renderHook(() => useLogout(), { wrapper: adminWrapper });

    await act(async () => {
      await result.current();
    });

    expect(document.querySelector('[data-testid="loc"]')?.textContent).toBe('/admin/login');
  });
});
