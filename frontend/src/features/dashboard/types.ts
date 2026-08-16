import type { Registration } from '@/types/registration';
import type { Schedule } from '@/types/schedule';
import type { Transaction } from '@/types/transaction';

export interface AdminDashboardData {
  activeStudents: number;
  teachers: number;
  activeCourses: number;
  studyingClasses: number;
  pendingRegistrations: Registration[];
  pendingTransactions: Transaction[];
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
}
