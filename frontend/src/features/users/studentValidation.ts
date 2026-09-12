import type { UserStatus } from '@/types/user';

export interface StudentFormValues {
  fullName: string;
  email: string;
  phone: string;
  status: UserStatus;
}

export type StudentFieldErrors = Partial<Record<'fullName' | 'email' | 'phone', string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VN_PHONE_PATTERN = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

export function validateStudent(values: StudentFormValues): StudentFieldErrors {
  const errors: StudentFieldErrors = {};

  if (!values.fullName.trim()) {
    errors.fullName = 'Họ tên không được để trống';
  }

  const email = values.email.trim();
  if (!email) {
    errors.email = 'Email không được để trống';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Email không hợp lệ';
  }

  const phone = values.phone.replace(/[\s.]/g, '');
  if (phone && !VN_PHONE_PATTERN.test(phone)) {
    errors.phone = 'Số điện thoại không hợp lệ';
  }

  return errors;
}

export function isConflictError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status?: unknown }).status === 409
  );
}
