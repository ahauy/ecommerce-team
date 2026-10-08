import { apiClient } from '@/services/apiClient';
import type {
  PaginatedResult,
  ProductDetail,
  ProductListParams,
  ProductSummary,
} from '@/types/product.types';

type Raw = Record<string, unknown>;

const asString = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);
const asNumber = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;
const asRecord = (v: unknown): Raw | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Raw) : null;

/**
 * Chuẩn hoá 1 item của `GET /products` về `ProductSummary`.
 * Chấp nhận cả dạng `seller: { id, shopName }` lẫn `sellerId` phẳng (và `_id` của Mongo).
 */
export const normalizeProductSummary = (raw: Raw): ProductSummary => {
  const seller = asRecord(raw.seller) ?? asRecord(raw.sellerId);
  const images = Array.isArray(raw.images) ? raw.images.filter((i): i is string => typeof i === 'string') : [];

  return {
    id: asString(raw.id) ?? asString(raw._id) ?? '',
    name: asString(raw.name) ?? '',
    slug: asString(raw.slug),
    price: asNumber(raw.price),
    stock: asNumber(raw.stock),
    imageUrl: images[0] ?? asString(raw.imageUrl),
    sellerId: seller
      ? (asString(seller.id) ?? asString(seller._id))
      : asString(raw.sellerId),
    shopName: seller ? asString(seller.shopName) : asString(raw.shopName),
  };
};

const normalizeProductDetail = (raw: Raw): ProductDetail => {
  const category = asRecord(raw.category);
  const seller = asRecord(raw.seller) ?? {};
  return {
    id: asString(raw.id) ?? asString(raw._id) ?? '',
    name: asString(raw.name) ?? '',
    slug: asString(raw.slug),
    description: asString(raw.description) ?? '',
    price: asNumber(raw.price),
    stock: asNumber(raw.stock),
    images: Array.isArray(raw.images) ? raw.images.filter((i): i is string => typeof i === 'string') : [],
    category: category
      ? {
          id: asString(category.id) ?? asString(category._id) ?? '',
          name: asString(category.name) ?? '',
          slug: asString(category.slug),
        }
      : null,
    seller: {
      id: asString(seller.id) ?? asString(seller._id) ?? '',
      shopName: asString(seller.shopName),
    },
    isActive: raw.isActive !== false,
    isBlocked: raw.isBlocked === true,
    blockReason: asString(raw.blockReason),
    createdAt: asString(raw.createdAt) ?? undefined,
    updatedAt: asString(raw.updatedAt) ?? undefined,
  };
};

/** Bỏ các tham số rỗng / undefined để URL sạch và cache key ổn định. */
const cleanParams = (params: ProductListParams): Record<string, string | number> => {
  const out: Record<string, string | number> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    out[key] = value as string | number;
  });
  return out;
};

export const productService = {
  /** `GET /products` — chỉ SP đang hiển thị (isActive && !isBlocked). */
  getProducts: async (params: ProductListParams = {}): Promise<PaginatedResult<ProductSummary>> => {
    const res = await apiClient.get<PaginatedResult<Raw>>('/products', { params: cleanParams(params) });
    const body = res.data;
    return {
      items: (body.items ?? []).map(normalizeProductSummary),
      total: body.total ?? 0,
      page: body.page ?? params.page ?? 1,
      limit: body.limit ?? params.limit ?? 0,
      totalPages: body.totalPages ?? 1,
    };
  },

  /** `GET /products/:id` — SP ẩn/bị khoá: chỉ Owner/Admin xem được, người khác nhận 404. */
  getProductById: async (id: string): Promise<ProductDetail> => {
    const res = await apiClient.get<Raw>(`/products/${id}`);
    return normalizeProductDetail(res.data);
  },

  /** `PATCH /products/:id` — bật/tắt hiển thị (Owner/Admin). */
  setActive: async (id: string, isActive: boolean): Promise<void> => {
    await apiClient.patch(`/products/${id}`, { isActive });
  },
};

export default productService;
