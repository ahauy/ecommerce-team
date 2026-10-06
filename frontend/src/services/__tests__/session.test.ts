const { refreshMock, profileMock } = vi.hoisted(() => ({
  refreshMock: vi.fn(),
  profileMock: vi.fn(),
}));
vi.mock('../auth.service', () => ({
  authService: { refresh: refreshMock },
  default: { refresh: refreshMock },
}));
vi.mock('../user.service', () => ({
  userService: { getProfile: profileMock },
  default: { getProfile: profileMock },
}));

// resetModules() tạo bản module mới → import store và session cùng lúc để dùng chung một instance.
const load = async () => {
  const [{ bootstrapSession }, { useAuthStore }] = await Promise.all([
    import('../session'),
    import('@/stores/auth.store'),
  ]);
  return { bootstrapSession, useAuthStore };
};

describe('bootstrapSession', () => {
  beforeEach(() => {
    vi.resetModules();
    refreshMock.mockReset();
    profileMock.mockReset();
  });

  it('restores the session from the refresh cookie', async () => {
    refreshMock.mockResolvedValue({ data: { accessToken: 'tok' } });
    profileMock.mockResolvedValue({ id: 'u1', email: 'a@b.c', fullName: 'An', role: 'admin' });
    const { bootstrapSession, useAuthStore } = await load();

    await bootstrapSession();

    const s = useAuthStore.getState();
    expect(s.status).toBe('authed');
    expect(s.accessToken).toBe('tok');
    expect(s.user).toEqual({ id: 'u1', email: 'a@b.c', fullName: 'An', role: 'admin' });
  });

  it('maps any non-admin role to customer', async () => {
    refreshMock.mockResolvedValue({ data: { accessToken: 'tok' } });
    profileMock.mockResolvedValue({ id: 'u1', email: 'a@b.c', fullName: 'An', role: 'whatever' });
    const { bootstrapSession, useAuthStore } = await load();
    await bootstrapSession();
    expect(useAuthStore.getState().user?.role).toBe('customer');
  });

  it('becomes guest when there is no valid refresh cookie', async () => {
    refreshMock.mockRejectedValue(new Error('401'));
    const { bootstrapSession, useAuthStore } = await load();

    await bootstrapSession();

    expect(useAuthStore.getState().status).toBe('guest');
    expect(profileMock).not.toHaveBeenCalled();
  });

  it('becomes guest (and drops the token) if loading the profile fails', async () => {
    refreshMock.mockResolvedValue({ data: { accessToken: 'tok' } });
    profileMock.mockRejectedValue(new Error('500'));
    const { bootstrapSession, useAuthStore } = await load();

    await bootstrapSession();

    expect(useAuthStore.getState().status).toBe('guest');
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('runs only once even if called repeatedly', async () => {
    refreshMock.mockResolvedValue({ data: { accessToken: 'tok' } });
    profileMock.mockResolvedValue({ id: 'u1', email: 'a@b.c', fullName: 'An', role: 'customer' });
    const { bootstrapSession, useAuthStore } = await load();

    await Promise.all([bootstrapSession(), bootstrapSession()]);
    await bootstrapSession();

    expect(refreshMock).toHaveBeenCalledTimes(1);
  });
});
