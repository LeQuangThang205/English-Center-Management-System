export type ClassStatus = 'UPCOMING' | 'STUDYING' | 'FINISHED' | 'CANCELLED';

export type ScheduleDay = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export interface CourseClass {
  id: number;
  courseId: number;
  courseName: string;
  name: string;
  teacherId?: number | null;
  teacherName?: string | null;
  maxCapacity: number;
  currentHeadcount: number;
  scheduleDay: ScheduleDay;
  startTime: string;
  endTime: string;
  room: string;
  startDate: string;
  endDate: string;
  status: ClassStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
}
