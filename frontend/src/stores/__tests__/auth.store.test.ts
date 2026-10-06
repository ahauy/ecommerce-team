import { useAuthStore } from '../auth.store';

const user = { id: 'u1', email: 'a@b.c', fullName: 'An', role: 'customer' as const };

describe('auth store', () => {
  beforeEach(() => {
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

  it('never persists the access token to web storage', () => {
    useAuthStore.getState().setSession(user, 'secret-token');
    expect(JSON.stringify({ ...localStorage })).not.toContain('secret-token');
    expect(JSON.stringify({ ...sessionStorage })).not.toContain('secret-token');
  });
});
