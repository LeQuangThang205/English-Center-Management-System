import { http } from '@/services/api/httpClient';
import type { AttendanceSheet } from '@/types/attendance';

export interface AttendanceSheetsQuery {
  classId?: number;
  date?: string;
}

export const attendanceApi = {
  getSheets: (query?: AttendanceSheetsQuery) => {
    const params = new URLSearchParams();
    if (query?.classId != null) params.set('classId', String(query.classId));
    if (query?.date) params.set('date', query.date);
    const qs = params.toString();
    return http.get<AttendanceSheet[]>(`/attendance/sheets${qs ? `?${qs}` : ''}`);
  },
};
