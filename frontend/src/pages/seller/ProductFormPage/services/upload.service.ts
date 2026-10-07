import { apiClient } from '@/services/apiClient';

export interface UploadImageResponse {
  url: string;
}

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const uploadService = {
  uploadImage: async (file: File): Promise<string> => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('Chỉ chấp nhận ảnh định dạng JPG, PNG hoặc WEBP');
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error('Kích thước ảnh không được vượt quá 5MB');
    }

    const formData = new FormData();
    formData.append('file', file);

    const res = await apiClient.post<UploadImageResponse>('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data.url;
  },
};
