export interface LoginFormValues {
  email: string;
  password: string;
}

export type LoginFieldErrors = Partial<Record<'email' | 'password', string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(values: LoginFormValues): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  const email = values.email.trim();

  if (!email) {
    errors.email = 'Vui lòng nhập email.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Email không hợp lệ.';
  }

  if (!values.password) {
    errors.password = 'Vui lòng nhập mật khẩu.';
  }

  return errors;
}