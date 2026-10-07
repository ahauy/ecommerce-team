import * as Yup from 'yup';
import { ProductFormValues } from '../types';

export const productValidationSchema: Yup.ObjectSchema<ProductFormValues> =
  Yup.object().shape({
    name: Yup.string()
      .trim()
      .required('Tên sản phẩm không được để trống')
      .max(120, 'Tên sản phẩm không được vượt quá 120 ký tự'),

    categoryId: Yup.string()
      .trim()
      .required('Vui lòng chọn danh mục sản phẩm'),

    description: Yup.string()
      .trim()
      .required('Mô tả sản phẩm không được để trống')
      .max(5000, 'Mô tả không được vượt quá 5000 ký tự'),

    price: Yup.number()
      .typeError('Giá phải là một số hợp lệ')
      .required('Giá không được để trống')
      .integer('Giá phải là số nguyên (VNĐ)')
      .min(1, 'Giá phải lớn hơn 0')
      .max(1_000_000_000, 'Giá sản phẩm quá lớn'),

    stock: Yup.number()
      .typeError('Tồn kho phải là một số hợp lệ')
      .required('Tồn kho không được để trống')
      .integer('Tồn kho phải là số nguyên')
      .min(0, 'Tồn kho không được âm')
      .max(1_000_000, 'Tồn kho quá lớn'),

    images: Yup.array()
      .of(Yup.string().required())
      .max(5, 'Tối đa 5 ảnh cho mỗi sản phẩm')
      .default([]),

    isActive: Yup.boolean().default(true),
  });

export const initialProductValues: ProductFormValues = {
  name: '',
  categoryId: '',
  description: '',
  price: '',
  stock: '',
  images: [],
  isActive: true,
};
