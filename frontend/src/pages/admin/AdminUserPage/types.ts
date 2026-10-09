export type AdminUserRole = 'customer' | 'admin';

export interface AdminUserShop {
  shopName: string;
  shopSlug: string | null;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: AdminUserRole;
  isActive: boolean;
  shop: AdminUserShop | null;
  productCount: number;
  createdAt: string;
}

export interface AdminUsersParams {
  page?: number;
  limit?: number;
  role?: AdminUserRole;
  isActive?: boolean;
  search?: string;
}

export interface AdminUsersResult {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type UserModerationAction = 'ban' | 'unban';
