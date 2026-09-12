import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { TeacherFieldErrors, TeacherFormValues } from '@/features/users/teacherValidation';

interface TeacherFormProps {
  values: TeacherFormValues;
  errors: TeacherFieldErrors;
  onChange: (field: keyof TeacherFormValues, value: string) => void;
}

export function TeacherForm({ values, errors, onChange }: TeacherFormProps) {
  return (
    <>
      <Input
        label="Họ tên"
        required
        value={values.fullName}
        error={errors.fullName}
        onChange={(event) => onChange('fullName', event.target.value)}
      />
      <Input
        label="Email"
        required
        type="email"
        value={values.email}
        error={errors.email}
        onChange={(event) => onChange('email', event.target.value)}
      />
      <Input
        label="Số điện thoại"
        value={values.phone}
        error={errors.phone}
        onChange={(event) => onChange('phone', event.target.value)}
      />
      <Select
        label="Trạng thái"
        required
        value={values.status}
        onChange={(event) => onChange('status', event.target.value)}
      >
        <option value="ACTIVE">Đang hoạt động</option>
        <option value="INACTIVE">Vô hiệu hóa</option>
      </Select>
      <Input label="Vai trò" value="Giáo viên (TEACHER)" disabled readOnly />
    </>
  );
}
