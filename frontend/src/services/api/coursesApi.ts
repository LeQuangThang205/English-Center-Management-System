import { http } from '@/services/api/httpClient';
import type { Course, CourseLevel, CourseStatus } from '@/types/course';

export interface CoursePayload {
  name: string;
  description?: string | null;
  tuition: number;
  level: CourseLevel;
  duration: number;
  status?: CourseStatus;
}

export const coursesApi = {
  getCourses: () => http.get<Course[]>('/courses'),
  getCourse: (id: number) => http.get<Course>(`/courses/${id}`),
  createCourse: (payload: CoursePayload) => http.post<Course>('/courses', payload),
  updateCourse: (id: number, payload: CoursePayload) => http.put<Course>(`/courses/${id}`, payload),
  deleteCourse: (id: number) => http.delete<void>(`/courses/${id}`),
};
