import { http } from '@/services/api/httpClient';
import type { Course } from '@/types/course';

export const coursesApi = {
  getCourses: () => http.get<Course[]>('/courses'),
};
