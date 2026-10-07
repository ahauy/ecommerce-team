import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ProfilePage from './ProfilePage';
import { userService } from '@/services/user.service';

vi.mock('@/services/user.service', () => {
  const mockService = {
    useGetProfile: vi.fn(),
    useUpdateProfile: vi.fn(),
    useSetupShop: vi.fn(),
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    setupShop: vi.fn(),
  };
  return {
    __esModule: true,
    userService: mockService,
    default: mockService,
  };
});

const mockUserService = userService as any;

const renderWithProviders = (component: React.ReactNode, profileData?: any) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  if (profileData) {
    queryClient.setQueryData(['user', 'profile'], profileData);
  }

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/account/profile']}>
        {component}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while fetching profile', () => {
    mockUserService.useGetProfile.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      isSuccess: false,
    } as any);

    renderWithProviders(<ProfilePage />);

    expect(screen.getByText(/đang tải/i)).toBeInTheDocument();
  });

  it('displays profile information when user has no shop', () => {
    const profileData = {
      id: '1',
      email: 'test@example.com',
      fullName: 'Nguyen Van A',
      phone: '0987654321',
      address: '123 Le Loi, District 1, HCMC',
      role: 'customer',
      isActive: true,
      version: 1,
      shop: null,
    };

    mockUserService.useGetProfile.mockReturnValue({
      data: profileData,
      isPending: false,
      isError: false,
      isSuccess: true,
    } as any);

    renderWithProviders(<ProfilePage />);

    expect(screen.getAllByText('Nguyen Van A')[0]).toBeInTheDocument();
    expect(screen.getAllByText('test@example.com')[0]).toBeInTheDocument();
    expect(screen.getByText('0987654321')).toBeInTheDocument();
    expect(screen.getByText('123 Le Loi, District 1, HCMC')).toBeInTheDocument();
    expect(screen.getByText('Chưa có gian hàng')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /đăng bán/i })).toBeInTheDocument();
  });

  it('links to the seller channel (not shop details) when user has a shop', () => {
    const profileData = {
      id: '1',
      email: 'test@example.com',
      fullName: 'Nguyen Van A',
      phone: '0987654321',
      address: '123 Le Loi, District 1, HCMC',
      role: 'customer',
      isActive: true,
      version: 1,
      shop: {
        shopName: 'My Awesome Shop',
        shopSlug: 'my-awesome-shop',
        pickupAddress: '456 Nguyen Van Linh, District 7, HCMC',
        joinedAt: '2024-01-15T10:30:00.000Z',
      },
    };

    mockUserService.useGetProfile.mockReturnValue({
      data: profileData,
      isPending: false,
      isError: false,
      isSuccess: true,
    } as any);

    renderWithProviders(<ProfilePage />);

    const sellerLink = screen.getByRole('link', { name: /đến kênh người bán/i });
    expect(sellerLink).toHaveAttribute('href', '/seller/products');
    // Thông tin gian hàng thuộc /seller/profile, không hiển thị ở hồ sơ người mua
    expect(screen.queryByText('My Awesome Shop')).not.toBeInTheDocument();
    expect(screen.queryByText('my-awesome-shop')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /đăng bán/i })).not.toBeInTheDocument();
  });

  it('shows "Đăng bán" button when user has no shop', () => {
    const profileData = {
      id: '1',
      email: 'test@example.com',
      fullName: 'Nguyen Van A',
      phone: '0987654321',
      address: '123 Le Loi, District 1, HCMC',
      role: 'customer',
      isActive: true,
      version: 1,
      shop: null,
    };

    mockUserService.useGetProfile.mockReturnValue({
      data: profileData,
      isPending: false,
      isError: false,
      isSuccess: true,
    } as any);

    renderWithProviders(<ProfilePage />);

    const dangBanButton = screen.getByRole('button', { name: /đăng bán/i });
    expect(dangBanButton).toBeInTheDocument();
    expect(dangBanButton).toHaveAttribute('href', '/seller/setup');
  });

  it('redirects to /seller/setup when clicking "Đăng bán" button', () => {
    const profileData = {
      id: '1',
      email: 'test@example.com',
      fullName: 'Nguyen Van A',
      phone: '0987654321',
      address: '123 Le Loi, District 1, HCMC',
      role: 'customer',
      isActive: true,
      version: 1,
      shop: null,
    };

    mockUserService.useGetProfile.mockReturnValue({
      data: profileData,
      isPending: false,
      isError: false,
      isSuccess: true,
    } as any);

    renderWithProviders(<ProfilePage />);

    const dangBanButton = screen.getByRole('button', { name: /đăng bán/i });
    expect(dangBanButton).toHaveAttribute('href', '/seller/setup');
  });

  it('applies two-canvas light theme (cream background)', () => {
    const profileData = {
      id: '1',
      email: 'test@example.com',
      fullName: 'Nguyen Van A',
      phone: '0987654321',
      address: '123 Le Loi, District 1, HCMC',
      role: 'customer',
      isActive: true,
      version: 1,
      shop: null,
    };

    mockUserService.useGetProfile.mockReturnValue({
      data: profileData,
      isPending: false,
      isError: false,
      isSuccess: true,
    } as any);

    renderWithProviders(<ProfilePage />);

    const mainContent = screen.getByTestId('profile-page');
    expect(mainContent).toHaveClass('bg-[#fbfbf5]');
  });

  it('uses pill-shaped buttons (rounded-full)', () => {
    const profileData = {
      id: '1',
      email: 'test@example.com',
      fullName: 'Nguyen Van A',
      phone: '0987654321',
      address: '123 Le Loi, District 1, HCMC',
      role: 'customer',
      isActive: true,
      version: 1,
      shop: null,
    };

    mockUserService.useGetProfile.mockReturnValue({
      data: profileData,
      isPending: false,
      isError: false,
      isSuccess: true,
    } as any);

    renderWithProviders(<ProfilePage />);

    const dangBanButton = screen.getByRole('button', { name: /đăng bán/i });
    expect(dangBanButton).toHaveClass('rounded-full');
  });

  it('applies ss03 typography feature', () => {
    const profileData = {
      id: '1',
      email: 'test@example.com',
      fullName: 'Nguyen Van A',
      phone: '0987654321',
      address: '123 Le Loi, District 1, HCMC',
      role: 'customer',
      isActive: true,
      version: 1,
      shop: null,
    };

    mockUserService.useGetProfile.mockReturnValue({
      data: profileData,
      isPending: false,
      isError: false,
      isSuccess: true,
    } as any);

    renderWithProviders(<ProfilePage />);

    const mainContent = screen.getByTestId('profile-page');
    expect(mainContent).toHaveStyle('font-feature-settings: "ss03"');
  });

  it('has 1px hairline borders on cards', () => {
    const profileData = {
      id: '1',
      email: 'test@example.com',
      fullName: 'Nguyen Van A',
      phone: '0987654321',
      address: '123 Le Loi, District 1, HCMC',
      role: 'customer',
      isActive: true,
      version: 1,
      shop: null,
    };

    mockUserService.useGetProfile.mockReturnValue({
      data: profileData,
      isPending: false,
      isError: false,
      isSuccess: true,
    } as any);

    renderWithProviders(<ProfilePage />);

    const profileCard = screen.getByTestId('profile-card');
    expect(profileCard).toHaveClass('border border-[#e4e4e7]');
  });

  it('applies Level 3 shadows on cards', () => {
    const profileData = {
      id: '1',
      email: 'test@example.com',
      fullName: 'Nguyen Van A',
      phone: '0987654321',
      address: '123 Le Loi, District 1, HCMC',
      role: 'customer',
      isActive: true,
      version: 1,
      shop: null,
    };

    mockUserService.useGetProfile.mockReturnValue({
      data: profileData,
      isPending: false,
      isError: false,
      isSuccess: true,
    } as any);

    renderWithProviders(<ProfilePage />);

    const profileCard = screen.getByTestId('profile-card');
    expect(profileCard).toHaveClass('shadow-card');
  });
});