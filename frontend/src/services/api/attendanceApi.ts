import { http } from '@/services/api/httpClient';
import type { AttendanceSheet, AttendanceStatus } from '@/types/attendance';

export interface AttendanceSheetsQuery {
  classId?: number;
  date?: string;
}

export interface AttendanceRecordPayload {
  studentId: number;
  status: AttendanceStatus;
}

export interface CreateAttendanceSheetPayload {
  classId: number;
  date: string;
  records: AttendanceRecordPayload[];
}

export interface UpdateAttendanceSheetPayload {
  records: AttendanceRecordPayload[];
}

export const attendanceApi = {
  getSheets: (query?: AttendanceSheetsQuery) => {
    const params = new URLSearchParams();
    if (query?.classId != null) params.set('classId', String(query.classId));
    if (query?.date) params.set('date', query.date);
    const qs = params.toString();
    return http.get<AttendanceSheet[]>(`/attendance/sheets${qs ? `?${qs}` : ''}`);
  },
  getSheet: (id: number) => http.get<AttendanceSheet>(`/attendance/sheets/${id}`),
  createAttendanceSheet: (payload: CreateAttendanceSheetPayload) =>
    http.post<AttendanceSheet>('/attendance/sheets', payload),
  updateAttendanceSheet: (id: number, payload: UpdateAttendanceSheetPayload) =>
    http.put<AttendanceSheet>(`/attendance/sheets/${id}`, payload),
};
