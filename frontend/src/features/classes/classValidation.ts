import type { BadgeTone } from '@/components/ui/Badge';
import type { ClassStatus, ScheduleDay } from '@/types/courseClass';

export const CLASS_STATUSES: readonly ClassStatus[] = ['UPCOMING', 'STUDYING', 'FINISHED', 'CANCELLED'];

export const CLASS_STATUS_LABELS: Record<ClassStatus, string> = {
  UPCOMING: 'Sắp khai giảng',
  STUDYING: 'Đang học',
  FINISHED: 'Đã kết thúc',
  CANCELLED: 'Đã hủy',
};

export const CLASS_STATUS_TONES: Record<ClassStatus, BadgeTone> = {
  UPCOMING: 'warning',
  STUDYING: 'primary',
  FINISHED: 'success',
  CANCELLED: 'danger',
};

export const SCHEDULE_DAYS: readonly ScheduleDay[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const SCHEDULE_DAY_LABELS: Record<ScheduleDay, string> = {
  MON: 'Thứ 2',
  TUE: 'Thứ 3',
  WED: 'Thứ 4',
  THU: 'Thứ 5',
  FRI: 'Thứ 6',
  SAT: 'Thứ 7',
  SUN: 'Chủ nhật',
};

export const SCHEDULE_DAY_OPTIONS: readonly ScheduleDay[] = [...SCHEDULE_DAYS];

export function formatSchedule(day: string, startTime: string, endTime: string): string {
  const dayLabel = (SCHEDULE_DAY_LABELS as Record<string, string>)[day] ?? day;
  const start = startTime.slice(0, 5);
  const end = endTime.slice(0, 5);
  return `${dayLabel} ${start}–${end}`;
}

export function isClassStatus(value: string): value is ClassStatus {
  return (CLASS_STATUSES as readonly string[]).includes(value);
}

export function isScheduleDay(value: string): value is ScheduleDay {
  return (SCHEDULE_DAYS as readonly string[]).includes(value);
}

export interface ClassFormValues {
  courseId: string;
  name: string;
  teacherId: string;
  maxCapacity: string;
  scheduleDay: string;
  startTime: string;
  endTime: string;
  room: string;
  startDate: string;
  endDate: string;
  status: ClassStatus;
}

export type ClassField =
  | 'courseId'
  | 'name'
  | 'teacherId'
  | 'maxCapacity'
  | 'scheduleDay'
  | 'startTime'
  | 'endTime'
  | 'room'
  | 'startDate'
  | 'endDate'
  | 'status';

export type ClassFieldErrors = Partial<Record<ClassField, string>>;

export interface ValidateClassOptions {
  mode: 'create' | 'edit';
  currentHeadcount?: number;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function validateClass(values: ClassFormValues, options: ValidateClassOptions): ClassFieldErrors {
  const errors: ClassFieldErrors = {};

  if (options.mode === 'create' && !values.courseId.trim()) {
    errors.courseId = 'Vui lòng chọn khóa học';
  }

  if (!values.name.trim()) {
    errors.name = 'Tên lớp không được để trống';
  }

  const capacity = Number(values.maxCapacity);
  if (!values.maxCapacity.trim() || !Number.isInteger(capacity) || capacity <= 0) {
    errors.maxCapacity = 'Sức chứa phải là số nguyên lớn hơn 0';
  } else if (
    options.mode === 'edit' &&
    options.currentHeadcount != null &&
    capacity < options.currentHeadcount
  ) {
    // FE guard: backend không enforce rule này, FE tự chặn để tránh sĩ số vượt sức chứa.
    errors.maxCapacity = `Sức chứa không được nhỏ hơn sĩ số hiện tại (${options.currentHeadcount})`;
  }

  if (!isScheduleDay(values.scheduleDay)) {
    errors.scheduleDay = 'Ngày học không hợp lệ';
  }

  if (!values.startTime.trim() || !TIME_PATTERN.test(values.startTime.trim())) {
    errors.startTime = 'Giờ bắt đầu không hợp lệ';
  }
  if (!values.endTime.trim() || !TIME_PATTERN.test(values.endTime.trim())) {
    errors.endTime = 'Giờ kết thúc không hợp lệ';
  }
  if (
    TIME_PATTERN.test(values.startTime.trim()) &&
    TIME_PATTERN.test(values.endTime.trim()) &&
    toMinutes(values.startTime.trim()) >= toMinutes(values.endTime.trim())
  ) {
    errors.endTime = 'Giờ kết thúc phải sau giờ bắt đầu';
  }

  if (!values.room.trim()) {
    errors.room = 'Phòng học không được để trống';
  }

  if (!values.startDate.trim() || !DATE_PATTERN.test(values.startDate.trim())) {
    errors.startDate = 'Ngày bắt đầu không hợp lệ';
  }
  if (!values.endDate.trim() || !DATE_PATTERN.test(values.endDate.trim())) {
    errors.endDate = 'Ngày kết thúc không hợp lệ';
  }
  if (
    DATE_PATTERN.test(values.startDate.trim()) &&
    DATE_PATTERN.test(values.endDate.trim()) &&
    values.startDate.trim() > values.endDate.trim()
  ) {
    errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
  }

  if (!isClassStatus(values.status)) {
    errors.status = 'Trạng thái không hợp lệ';
  }

  return errors;
}

export interface ClassRequestPayload {
  courseId?: number;
  name: string;
  teacherId: number | null;
  maxCapacity: number;
  scheduleDay: ScheduleDay;
  startTime: string;
  endTime: string;
  room: string;
  startDate: string;
  endDate: string;
  status: ClassStatus;
}

export function buildClassPayload(
  values: ClassFormValues,
  mode: 'create' | 'edit',
): ClassRequestPayload {
  const teacherId = values.teacherId.trim();
  const payload: ClassRequestPayload = {
    name: values.name.trim(),
    teacherId: teacherId ? Number(teacherId) : null,
    maxCapacity: Number(values.maxCapacity),
    scheduleDay: values.scheduleDay as ScheduleDay,
    startTime: values.startTime.trim().slice(0, 5),
    endTime: values.endTime.trim().slice(0, 5),
    room: values.room.trim(),
    startDate: values.startDate.trim(),
    endDate: values.endDate.trim(),
    status: values.status,
  };
  if (mode === 'create') {
    payload.courseId = Number(values.courseId);
  }
  return payload;
}
