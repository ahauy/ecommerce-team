import * as Yup from 'yup';

export interface CategoryFormValues {
  name: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
}

export const CategorySchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .min(2, 'Tên danh mục phải có ít nhất 2 ký tự')
    .max(50, 'Tên danh mục không được vượt quá 50 ký tự')
    .required('Vui lòng nhập tên danh mục'),
  description: Yup.string().max(500, 'Mô tả không được vượt quá 500 ký tự'),
  imageUrl: Yup.string()
    .trim()
    .url('Đường dẫn ảnh phải là URL hợp lệ (http:// hoặc https://)')
    .nullable(),
  isActive: Yup.boolean().required(),
});

export default CategorySchema;
