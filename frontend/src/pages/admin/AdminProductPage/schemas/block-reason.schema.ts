import * as Yup from 'yup';
import { SELLER_BANNED_REASON } from '../types';

export const BLOCK_REASON_MIN = 5;
export const BLOCK_REASON_MAX = 500;

export interface BlockReasonFormValues {
  reason: string;
}

export const BlockReasonSchema = Yup.object().shape({
  reason: Yup.string()
    .trim()
    .required('Vui lòng nhập lý do chặn sản phẩm')
    .min(BLOCK_REASON_MIN, `Lý do chặn phải có ít nhất ${BLOCK_REASON_MIN} ký tự`)
    .max(BLOCK_REASON_MAX, `Lý do chặn không được vượt quá ${BLOCK_REASON_MAX} ký tự`)
    .notOneOf([SELLER_BANNED_REASON], 'Lý do này dành riêng cho hệ thống, vui lòng nhập lý do khác'),
});

export const BLOCK_REASON_PRESETS = [
  'Hàng giả, hàng nhái thương hiệu',
  'Hình ảnh hoặc mô tả sai sự thật',
  'Hàng cấm kinh doanh',
  'Giá bán bất thường, có dấu hiệu lừa đảo',
];

export default BlockReasonSchema;
