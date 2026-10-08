import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockProfile } = vi.hoisted(() => ({ mockProfile: vi.fn() }));

vi.mock('@/services/user.service', () => ({ userService: { useGetProfile: mockProfile } }));
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { id: 'u1', fullName: 'Nguyễn Văn An', email: 'a@x.vn', role: 'customer' } }),
}));

import AccountSidebar from '../index';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AccountSidebar />
    </MemoryRouter>
  );

describe('AccountSidebar', () => {
  beforeEach(() => {
    mockProfile.mockReturnValue({ data: { fullName: 'Nguyễn Văn An', shop: null } });
  });

  it('shows the account name and the three menu entries', () => {
    renderAt('/account/orders');
    expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Hồ sơ' })).toHaveAttribute('href', '/account/profile');
    expect(screen.getByRole('link', { name: 'Đơn mua' })).toHaveAttribute('href', '/account/orders');
  });

  it('keeps "Đơn mua" active on the order detail route', () => {
    renderAt('/account/orders/abc');
    expect(screen.getByRole('link', { name: 'Đơn mua' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Hồ sơ' })).not.toHaveAttribute('aria-current');
  });

  it('points to shop setup when the user has no shop, otherwise to the seller channel', () => {
    renderAt('/account/orders');
    expect(screen.getByRole('link', { name: /Đăng bán/ })).toHaveAttribute('href', '/seller/setup');
  });

  it('points to the seller channel when the user has a shop', () => {
    mockProfile.mockReturnValue({ data: { fullName: 'Nguyễn Văn An', shop: { shopName: 'S' } } });
    renderAt('/account/orders');
    expect(screen.getByRole('link', { name: /Kênh người bán/ })).toHaveAttribute('href', '/seller/products');
  });
});
