import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import ProfileForm from './ProfileForm';
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
const { mockToast } = vi.hoisted(() => ({
  mockToast: vi.fn(),
}));
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
  toast: mockToast,
}));

const mockUserService = userService as any;

const defaultInitialValues = {
  fullName: 'Test User',
  phone: '0987654321',
  address: '123 Test Street',
};

const renderWithProviders = (component?: React.ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {component ?? <ProfileForm initialValues={defaultInitialValues} />}
    </QueryClientProvider>
  );
};

describe('ProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields with initial values', () => {
    renderWithProviders();

    expect(screen.getByLabelText('Họ tên')).toHaveValue('Test User');
    expect(screen.getByLabelText('Số điện thoại')).toHaveValue('0987654321');
    expect(screen.getByLabelText('Địa chỉ')).toHaveValue('123 Test Street');
  });

  it('shows validation error for empty fullName', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    const fullNameInput = screen.getByLabelText('Họ tên');
    await user.clear(fullNameInput);
    await user.tab();

    expect(await screen.findByText('Họ tên không được để trống')).toBeInTheDocument();
  });

  it('shows validation error for invalid phone format', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    const phoneInput = screen.getByLabelText('Số điện thoại');
    await user.clear(phoneInput);
    await user.type(phoneInput, '123');
    await user.tab();

    expect(await screen.findByText('Số điện thoại không hợp lệ')).toBeInTheDocument();
  });

  it('allows empty phone string without validation error', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    const phoneInput = screen.getByLabelText('Số điện thoại');
    await user.clear(phoneInput);
    await user.tab();

    expect(screen.queryByText('Số điện thoại không hợp lệ')).not.toBeInTheDocument();
  });

  it('shows validation error for address too long', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    const addressInput = screen.getByLabelText('Địa chỉ');
    await user.clear(addressInput);
    const longAddress = 'a'.repeat(501);
    await user.type(addressInput, longAddress);
    await user.tab();

    expect(await screen.findByText('Địa chỉ tối đa 500 ký tự')).toBeInTheDocument();
  });

  it('calls updateProfile mutation on valid submit', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      id: '1',
      email: 'test@example.com',
      fullName: 'Updated Name',
      phone: '0987654321',
      address: 'Updated Address',
      role: 'customer',
      isActive: true,
      version: 2,
      shop: null,
    };
    mockUserService.useUpdateProfile.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(mockResponse),
      isPending: false,
      isError: false,
      isSuccess: true,
    } as any);

    renderWithProviders();

    const fullNameInput = screen.getByLabelText('Họ tên');
    await user.clear(fullNameInput);
    await user.type(fullNameInput, 'Updated Name');

    const submitButton = screen.getByRole('button', { name: /lưu thay đổi/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUserService.useUpdateProfile).toHaveBeenCalled();
    });
  });

  it('shows success toast on successful update', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      id: '1',
      email: 'test@example.com',
      fullName: 'Updated Name',
      phone: '0987654321',
      address: 'Updated Address',
      role: 'customer',
      isActive: true,
      version: 2,
      shop: null,
    };
    mockUserService.useUpdateProfile.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(mockResponse),
      isPending: false,
      isError: false,
      isSuccess: true,
    } as any);

    renderWithProviders();

    const submitButton = screen.getByRole('button', { name: /lưu thay đổi/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Cập nhật thành công',
          variant: 'default',
        })
      );
    });
  });

  it('shows error toast on failed update', async () => {
    const user = userEvent.setup();
    mockUserService.useUpdateProfile.mockReturnValue({
      mutateAsync: vi.fn().mockRejectedValue(new Error('Network error')),
      isPending: false,
      isError: true,
      isSuccess: false,
    } as any);

    renderWithProviders(<ProfileForm initialValues={{ fullName: 'Test User', phone: '', address: '' }} />);

    const submitButton = screen.getByRole('button', { name: /lưu thay đổi/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Cập nhật thất bại',
          variant: 'destructive',
        })
      );
    });
  });

  it('disables submit button while submitting', async () => {
    let resolveMutation: (value: any) => void;
    const mutationPromise = new Promise((resolve) => {
      resolveMutation = resolve;
    });

    mockUserService.useUpdateProfile.mockReturnValue({
      mutateAsync: vi.fn().mockReturnValue(mutationPromise),
      isPending: true,
      isError: false,
      isSuccess: false,
    } as any);

    renderWithProviders(<ProfileForm initialValues={{ fullName: 'Test User', phone: '', address: '' }} />);

    const submitButton = screen.getByRole('button', { name: /đang lưu/i });
    expect(submitButton).toBeDisabled();
  });

  it('has ARIA live region for validation errors', () => {
    renderWithProviders(<ProfileForm />);

    const liveRegion = screen.getByRole('status', { hidden: true });
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });
});
