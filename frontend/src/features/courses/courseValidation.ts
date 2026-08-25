import type { CourseLevel } from '@/types/course';

export const COURSE_LEVELS: readonly CourseLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

export const COURSE_LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER: 'Sơ cấp',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Cao cấp',
};

export interface CourseFormValues {
  name: string;
  description: string;
  tuition: string;
  level: string;
  duration: string;
}

export type CourseField = 'name' | 'description' | 'tuition' | 'level' | 'duration';

export type CourseFieldErrors = Partial<Record<'name' | 'tuition' | 'level' | 'duration', string>>;

export function isCourseLevel(value: string): value is CourseLevel {
  return (COURSE_LEVELS as readonly string[]).includes(value);
}

export function validateCourse(values: CourseFormValues): CourseFieldErrors {
  const errors: CourseFieldErrors = {};

  if (!values.name.trim()) {
    errors.name = 'Tên khóa học không được để trống';
  }

  const tuition = Number(values.tuition);
  if (!values.tuition.trim() || !Number.isFinite(tuition) || tuition <= 0) {
    errors.tuition = 'Học phí phải lớn hơn 0';
  }

  if (!isCourseLevel(values.level)) {
    errors.level = 'Cấp độ không hợp lệ';
  }

  const duration = Number(values.duration);
  if (!values.duration.trim() || !Number.isInteger(duration) || duration <= 0) {
    errors.duration = 'Thời lượng phải là số nguyên dương';
  }

  return errors;
}

export interface CourseRequestPayload {
  name: string;
  description: string | null;
  tuition: number;
  level: CourseLevel;
  duration: number;
}

export function buildCoursePayload(values: CourseFormValues): CourseRequestPayload {
  const description = values.description.trim();
  return {
    name: values.name.trim(),
    description: description ? description : null,
    tuition: Number(values.tuition),
    level: values.level as CourseLevel,
    duration: Number(values.duration),
  };
}
