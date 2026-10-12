import { useAuthStore } from '../auth.store';

const user = { id: 'u1', email: 'a@b.c', fullName: 'An', role: 'customer' as const };

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ status: 'booting', user: null, accessToken: null });
  });

  it('starts in booting state with no session', () => {
    const s = useAuthStore.getState();
    expect(s.status).toBe('booting');
    expect(s.user).toBeNull();
    expect(s.accessToken).toBeNull();
  });

  it('setSession → authed with user and token', () => {
    useAuthStore.getState().setSession(user, 'tok');
    const s = useAuthStore.getState();
    expect(s.status).toBe('authed');
    expect(s.user).toEqual(user);
    expect(s.accessToken).toBe('tok');
  });

  it('clear → guest and drops everything', () => {
    useAuthStore.getState().setSession(user, 'tok');
    useAuthStore.getState().clear();
    const s = useAuthStore.getState();
    expect(s.status).toBe('guest');
    expect(s.user).toBeNull();
    expect(s.accessToken).toBeNull();
  });

  it('persists user and accessToken to localStorage on setSession and removes them on clear', () => {
    useAuthStore.getState().setSession(user, 'secret-token');
    expect(localStorage.getItem('teamshop_access_token')).toBe('secret-token');
    expect(JSON.parse(localStorage.getItem('teamshop_auth_user') || 'null')).toEqual(user);

    useAuthStore.getState().clear();
    expect(localStorage.getItem('teamshop_access_token')).toBeNull();
    expect(localStorage.getItem('teamshop_auth_user')).toBeNull();
  });
});
