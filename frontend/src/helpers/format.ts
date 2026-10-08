const vndFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

/** 12890000 → "12.890.000 ₫" */
export const formatVnd = (value: number): string => vndFormatter.format(value);

/** "2026-03-12T00:00:00.000Z" → "03/2026" (rỗng nếu không hợp lệ). */
export const formatMonthYear = (iso?: string | null): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

/** Lấy HTTP status từ lỗi axios (nếu có). */
export const getHttpStatus = (error: unknown): number | undefined => {
  if (error && typeof error === 'object' && 'response' in error) {
    return (error as { response?: { status?: number } }).response?.status;
  }
  return undefined;
};
