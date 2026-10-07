import { apiClient } from './apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface ShopProfileDto {
  shopName: string;
  shopSlug: string;
  pickupAddress: string;
  joinedAt: string;
  phone: string;
}

export interface GetProfileResponseDto {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  address?: string | null;
  role: string;
  isActive: boolean;
  version?: number;
  shop: ShopProfileDto | null;
}

export interface UpdateProfileDto {
  fullName?: string;
  phone?: string;
  address?: string;
}

export interface SetupShopDto {
  shopName: string;
  pickupAddress: string;
  phone: string;
}

const USER_PROFILE_KEY = ['user', 'profile'];

export const userService = {
  getProfile: async (): Promise<GetProfileResponseDto> => {
    const response = await apiClient.get<GetProfileResponseDto>('/users/me');
    return response.data;
  },

  updateProfile: async (dto: UpdateProfileDto): Promise<GetProfileResponseDto> => {
    const response = await apiClient.patch<GetProfileResponseDto>('/users/me', dto);
    return response.data;
  },

  setupShop: async (dto: SetupShopDto): Promise<GetProfileResponseDto> => {
    const response = await apiClient.patch<GetProfileResponseDto>('/users/me/shop', dto);
    return response.data;
  },

  useGetProfile: (enabled = true) => {
    return useQuery({
      queryKey: USER_PROFILE_KEY,
      queryFn: userService.getProfile,
      enabled,
    });
  },

  useUpdateProfile: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: userService.updateProfile,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: USER_PROFILE_KEY });
      },
    });
  },

  useSetupShop: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: userService.setupShop,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: USER_PROFILE_KEY });
      },
    });
  },
};

export default userService;