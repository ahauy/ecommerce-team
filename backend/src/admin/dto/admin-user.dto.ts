import { UserRole } from '../../users/schemas/user.schema';

export interface AdminUserDto {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  shop: { shopName: string; shopSlug: string | null } | null;
  productCount: number;
  createdAt: string;
}

export interface PaginatedAdminUsersDto {
  items: AdminUserDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
