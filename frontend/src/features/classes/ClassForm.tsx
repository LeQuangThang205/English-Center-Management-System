import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  CLASS_STATUSES,
  CLASS_STATUS_LABELS,
  SCHEDULE_DAY_LABELS,
  SCHEDULE_DAY_OPTIONS,
  type ClassFieldErrors,
  type ClassFormValues,
} from '@/features/classes/classValidation';
import type { Course } from '@/types/course';
import type { User } from '@/types/user';

interface ClassFormProps {
  mode: 'create' | 'edit';
  values: ClassFormValues;
  errors: ClassFieldErrors;
  courses: Course[];
  teachers: User[];
  courseName?: string;
  onChange: (field: keyof ClassFormValues, value: string) => void;
}

export function ClassForm({ mode, values, errors, courses, teachers, courseName, onChange }: ClassFormProps) {
  return (
    <>
      {mode === 'create' ? (
        <Select
          label="Khóa học"
          required
          value={values.courseId}
          error={errors.courseId}
          onChange={(event) => onChange('courseId', event.target.value)}
        >
          <option value="">Chọn khóa học</option>
          {courses.map((course) => (
            <option key={course.id} value={String(course.id)}>
              {course.name}
            </option>
          ))}
        </Select>
      ) : (
        <Input label="Khóa học" value={courseName ?? ''} disabled readOnly />
      )}
      <Input
        label="Tên lớp"
        required
        value={values.name}
        error={errors.name}
        onChange={(event) => onChange('name', event.target.value)}
      />
      <Select
        label="Giáo viên"
        value={values.teacherId}
        error={errors.teacherId}
        onChange={(event) => onChange('teacherId', event.target.value)}
      >
        <option value="">Chưa phân công</option>
        {teachers.map((teacher) => (
          <option key={teacher.id} value={String(teacher.id)}>
            {teacher.fullName} ({teacher.email})
          </option>
        ))}
      </Select>
      <Input
        label="Sức chứa tối đa"
        required
        type="number"
        min={1}
        value={values.maxCapacity}
        error={errors.maxCapacity}
        onChange={(event) => onChange('maxCapacity', event.target.value)}
      />
      <Select
        label="Ngày học trong tuần"
        required
        value={values.scheduleDay}
        error={errors.scheduleDay}
        onChange={(event) => onChange('scheduleDay', event.target.value)}
      >
        <option value="">Chọn ngày học</option>
        {SCHEDULE_DAY_OPTIONS.map((day) => (
          <option key={day} value={day}>
            {SCHEDULE_DAY_LABELS[day]}
          </option>
        ))}
      </Select>
      <Input
        label="Giờ bắt đầu"
        required
        type="time"
        value={values.startTime}
        error={errors.startTime}
        onChange={(event) => onChange('startTime', event.target.value)}
      />
      <Input
        label="Giờ kết thúc"
        required
        type="time"
        value={values.endTime}
        error={errors.endTime}
        onChange={(event) => onChange('endTime', event.target.value)}
      />
      <Input
        label="Phòng học"
        required
        value={values.room}
        error={errors.room}
        onChange={(event) => onChange('room', event.target.value)}
      />
      <Input
        label="Ngày bắt đầu"
        required
        type="date"
        value={values.startDate}
        error={errors.startDate}
        onChange={(event) => onChange('startDate', event.target.value)}
      />
      <Input
        label="Ngày kết thúc"
        required
        type="date"
        value={values.endDate}
        error={errors.endDate}
        onChange={(event) => onChange('endDate', event.target.value)}
      />
      <Select
        label="Trạng thái"
        required
        value={values.status}
        error={errors.status}
        onChange={(event) => onChange('status', event.target.value)}
      >
        {CLASS_STATUSES.map((status) => (
          <option key={status} value={status}>
            {CLASS_STATUS_LABELS[status]}
          </option>
        ))}
      </Select>
    </>
  );
}
