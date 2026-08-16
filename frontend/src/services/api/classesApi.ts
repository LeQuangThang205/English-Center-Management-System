import { http } from '@/services/api/httpClient';
import type { ClassStatus, CourseClass } from '@/types/courseClass';

export interface ClassesQuery {
  courseId?: number;
  teacherId?: number;
  status?: ClassStatus;
}

export const classesApi = {
  getClasses: (query?: ClassesQuery) => {
    const params = new URLSearchParams();
    if (query?.courseId != null) params.set('courseId', String(query.courseId));
    if (query?.teacherId != null) params.set('teacherId', String(query.teacherId));
    if (query?.status) params.set('status', query.status);
    const qs = params.toString();
    return http.get<CourseClass[]>(`/classes${qs ? `?${qs}` : ''}`);
  },
};
