import * as Yup from 'yup';

export const changePasswordSchema = Yup.object().shape({
  nextPassword: Yup.string().required('New password is required field!'),
  confirmPassword: Yup.string().required('Confirm password is required field!'),
});

export default changePasswordSchema;
