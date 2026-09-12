import { http } from '@/services/api/httpClient';
import type { ClassStatus, CourseClass, ScheduleDay } from '@/types/courseClass';

export interface ClassesQuery {
  courseId?: number;
  teacherId?: number;
  status?: ClassStatus;
}

export interface ClassPayload {
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

export const classesApi = {
  getClasses: (query?: ClassesQuery) => {
    const params = new URLSearchParams();
    if (query?.courseId != null) params.set('courseId', String(query.courseId));
    if (query?.teacherId != null) params.set('teacherId', String(query.teacherId));
    if (query?.status) params.set('status', query.status);
    const qs = params.toString();
    return http.get<CourseClass[]>(`/classes${qs ? `?${qs}` : ''}`);
  },
  createClass: (payload: ClassPayload) => http.post<CourseClass>('/classes', payload),
  updateClass: (id: number, payload: ClassPayload) => http.put<CourseClass>(`/classes/${id}`, payload),
  deleteClass: (id: number) => http.delete<void>(`/classes/${id}`),
};
