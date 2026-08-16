import type { ScheduleDay } from '@/types/courseClass';

export interface Schedule {
  classId: number;
  className: string;
  courseName: string;
  scheduleDay: ScheduleDay;
  startTime: string;
  endTime: string;
  room: string;
  teacherId?: number | null;
  teacherName?: string | null;
  startDate: string;
  endDate: string;
}
