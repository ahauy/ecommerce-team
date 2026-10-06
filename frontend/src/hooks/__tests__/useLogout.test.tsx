import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

const { logoutMock } = vi.hoisted(() => ({ logoutMock: vi.fn() }));
vi.mock('@/services/auth.service', () => ({
  authService: { logout: logoutMock },
  default: { logout: logoutMock },
}));

import useLogout from '../useLogout';
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
});
