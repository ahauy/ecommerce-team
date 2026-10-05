import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProfileForm from '../ProfileForm';
import { userService } from '@/services/user.service';
import { toast } from '@/components/ui/use-toast';

jest.mock('@/services/user.service');
jest.mock('@/components/ui/use-toast', () => ({
  toast: jest.fn(),
}));

const mockUserService = userService as jest.Mocked<typeof userService>;
const mockToast = toast as jest.MockedFunction<typeof toast>;

const renderWithProviders = (component: React.ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Formik
        initialValues={{
          fullName: 'Test User',
          phone: '0987654321',
          address: '123 Test Street',
        }}
        validationSchema={Yup.object().shape({
          fullName: Yup.string().min(2, 'Họ tên phải từ 2-100 ký tự').max(100, 'Họ tên tối đa 100 ký tự'),
          phone: Yup.string()
            .transform((value) => (!value || !value.trim() ? null : value.trim()))
            .nullable()
            .notRequired()
            .matches(/^(\+84|0)[0-9]{9,10}$/, {
              message: 'Số điện thoại không hợp lệ',
              excludeEmptyString: true,
            }),
          address: Yup.string().max(500, 'Địa chỉ tối đa 500 ký tự'),
        })}
        onSubmit={() => {}}
      >
        {() => <Form>{component}</Form>}
      </Formik>
    </QueryClientProvider>
  );
};

describe('ProfileForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form fields with initial values', () => {
    renderWithProviders(<ProfileForm />);

    expect(screen.getByLabelText('Họ tên')).toHaveValue('Test User');
    expect(screen.getByLabelText('Số điện thoại')).toHaveValue('0987654321');
    expect(screen.getByLabelText('Địa chỉ')).toHaveValue('123 Test Street');
  });

  it('shows validation error for empty fullName', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfileForm />);

    const fullNameInput = screen.getByLabelText('Họ tên');
    await user.clear(fullNameInput);
    await user.tab();

    expect(await screen.findByText('Họ tên phải từ 2-100 ký tự')).toBeInTheDocument();
  });

  it('shows validation error for invalid phone format', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfileForm />);

    const phoneInput = screen.getByLabelText('Số điện thoại');
    await user.clear(phoneInput);
    await user.type(phoneInput, '123');
    await user.tab();

    expect(await screen.findByText('Số điện thoại không hợp lệ')).toBeInTheDocument();
  });

  it('allows empty phone string without validation error', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfileForm />);

    const phoneInput = screen.getByLabelText('Số điện thoại');
    await user.clear(phoneInput);
    await user.tab();

    expect(screen.queryByText('Số điện thoại không hợp lệ')).not.toBeInTheDocument();
  });

  it('shows validation error for address too long', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfileForm />);

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
      mutateAsync: jest.fn().mockResolvedValue(mockResponse),
      isPending: false,
      isError: false,
      isSuccess: true,
    } as any);

    renderWithProviders(<ProfileForm />);

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
      mutateAsync: jest.fn().mockResolvedValue(mockResponse),
      isPending: false,
      isError: false,
      isSuccess: true,
    } as any);

    renderWithProviders(<ProfileForm />);

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
      mutateAsync: jest.fn().mockRejectedValue(new Error('Network error')),
      isPending: false,
      isError: true,
      isSuccess: false,
    } as any);

    renderWithProviders(<ProfileForm />);

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
      mutateAsync: jest.fn().mockReturnValue(mutationPromise),
      isPending: true,
      isError: false,
      isSuccess: false,
    } as any);

    renderWithProviders(<ProfileForm />);

    const submitButton = screen.getByRole('button', { name: /lưu thay đổi/i });
    expect(submitButton).toBeDisabled();
  });

  it('has ARIA live region for validation errors', () => {
    renderWithProviders(<ProfileForm />);

    const liveRegion = screen.getByRole('status', { hidden: true });
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });
});