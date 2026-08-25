export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED';

export interface AttendanceRecord {
  id: number;
  studentId: number;
  studentName: string;
  status: AttendanceStatus;
}

export interface AttendanceSheet {
  id: number;
  classId: number;
  className: string;
  courseName: string;
  date: string;
  createdById?: number | null;
  createdByName?: string | null;
  records: AttendanceRecord[];
  createdAt?: string | null;
  updatedAt?: string | null;
}
