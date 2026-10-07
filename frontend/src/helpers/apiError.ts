/**
 * Lấy thông điệp hiển thị cho người dùng từ lỗi bất kỳ:
 * `response.data.message` của API (`{ success:false, message }`) → `Error.message` → fallback.
 */
export const getApiMessage = (
  error: unknown,
  fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.'
): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const message = (error as { response?: { data?: { message?: unknown } } }).response?.data?.message;
    if (typeof message === 'string' && message) return message;
    if (Array.isArray(message) && typeof message[0] === 'string') return message[0];
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};
