export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type CourseStatus = 'ACTIVE' | 'DELETED';

export interface Course {
  id: number;
  name: string;
  description?: string | null;
  tuition: number;
  level: CourseLevel;
  duration: number;
  status: CourseStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
}
