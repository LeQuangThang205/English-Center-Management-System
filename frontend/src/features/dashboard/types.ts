import type { Registration } from '@/types/registration';
import type { Schedule } from '@/types/schedule';
import type { Transaction } from '@/types/transaction';

export interface MonthDatum {
  key: string;
  label: string;
  value: number;
}

export type RevenueByMonth = MonthDatum;

export type NewStudentsByMonth = MonthDatum;

export interface ClassAttendance {
  classId: number;
  className: string;
  courseName: string;
  rate: number;
  present: number;
  total: number;
}

export interface AdminDashboardData {
  activeStudents: number;
  teachers: number;
  activeCourses: number;
  studyingClasses: number;
  currentMonthRevenue: number;
  pendingRegistrations: Registration[];
  pendingTransactions: Transaction[];
  revenueByMonth: RevenueByMonth[];
  newStudentsByMonth: NewStudentsByMonth[];
  attendanceByClass: ClassAttendance[];
}

export interface TeacherDashboardData {
  studyingClasses: number;
  totalClasses: number;
  weeklySessions: Schedule[];
  unreadNotifications: number;
}

export interface StudentDashboardData {
  myCourses: Registration[];
  pendingRegistrationCount: number;
  pendingRegistrations: Registration[];
  weeklySessions: Schedule[];
  unreadNotifications: number;
}

export type DashboardData = AdminDashboardData | TeacherDashboardData | StudentDashboardData;

export interface DashboardStat {
  key: string;
  label: string;
  value: number;
  formatter?: (value: number) => string;
}
