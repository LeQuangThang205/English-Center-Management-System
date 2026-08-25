import { attendanceApi } from '@/services/api/attendanceApi';
import { classesApi } from '@/services/api/classesApi';
import { coursesApi } from '@/services/api/coursesApi';
import { notificationsApi } from '@/services/api/notificationsApi';
import { registrationsApi } from '@/services/api/registrationsApi';
import { schedulesApi } from '@/services/api/schedulesApi';
import { transactionsApi } from '@/services/api/transactionsApi';
import { usersApi } from '@/services/api/usersApi';
import type { AttendanceSheet } from '@/types/attendance';
import type { ScheduleDay } from '@/types/courseClass';
import type { Schedule } from '@/types/schedule';
import type { Transaction } from '@/types/transaction';
import type { User } from '@/types/user';
import { formatVnd } from '@/utils/format';
import type {
  AdminDashboardData,
  ClassAttendance,
  DashboardStat,
  NewStudentsByMonth,
  RevenueByMonth,
  StudentDashboardData,
  TeacherDashboardData,
} from '@/features/dashboard/types';

export const SCHEDULE_DAY_ORDER: Record<ScheduleDay, number> = {
  MON: 0,
  TUE: 1,
  WED: 2,
  THU: 3,
  FRI: 4,
  SAT: 5,
  SUN: 6,
};

export const SCHEDULE_DAY_LABELS: Record<ScheduleDay, string> = {
  MON: 'Thứ 2',
  TUE: 'Thứ 3',
  WED: 'Thứ 4',
  THU: 'Thứ 5',
  FRI: 'Thứ 6',
  SAT: 'Thứ 7',
  SUN: 'Chủ nhật',
};

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function monthKeyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-');
  return `${month}/${year}`;
}

export function startOfWeek(date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return toIsoDate(d);
}

export function endOfWeek(date: Date = new Date()): string {
  const [year, month, day] = startOfWeek(date).split('-').map(Number);
  return toIsoDate(new Date(year, month - 1, day + 6));
}

export function sortSchedules(list: Schedule[]): Schedule[] {
  return [...list].sort((a, b) => {
    const dayDiff = SCHEDULE_DAY_ORDER[a.scheduleDay] - SCHEDULE_DAY_ORDER[b.scheduleDay];
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });
}

function revenueDate(transaction: Transaction): Date | null {
  const value = transaction.paidAt ?? transaction.createdAt;
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function aggregateRevenueByMonth(transactions: Transaction[]): RevenueByMonth[] {
  const totals = new Map<string, number>();
  for (const transaction of transactions) {
    if (transaction.status !== 'SUCCESS') continue;
    const date = revenueDate(transaction);
    if (!date) continue;
    const key = monthKeyOf(date);
    totals.set(key, (totals.get(key) ?? 0) + transaction.amount);
  }
  return [...totals.entries()]
    .map(([key, value]) => ({ key, label: monthLabel(key), value }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function currentMonthKey(date: Date = new Date()): string {
  return monthKeyOf(date);
}

export function getCurrentMonthRevenue(transactions: Transaction[]): number {
  const key = currentMonthKey();
  return aggregateRevenueByMonth(transactions)
    .filter((item) => item.key === key)
    .reduce((sum, item) => sum + item.value, 0);
}

export function aggregateNewStudentsByMonth(users: User[]): NewStudentsByMonth[] {
  const counts = new Map<string, number>();
  for (const user of users) {
    if (!user.createdAt) continue;
    const date = new Date(user.createdAt);
    if (Number.isNaN(date.getTime())) continue;
    const key = monthKeyOf(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, value]) => ({ key, label: monthLabel(key), value }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function aggregateAttendanceByClass(sheets: AttendanceSheet[]): ClassAttendance[] {
  const byClass = new Map<
    number,
    { className: string; courseName: string; present: number; total: number }
  >();
  for (const sheet of sheets) {
    const entry =
      byClass.get(sheet.classId) ?? {
        className: sheet.className,
        courseName: sheet.courseName,
        present: 0,
        total: 0,
      };
    entry.total += sheet.records.length;
    entry.present += sheet.records.filter((record) => record.status === 'PRESENT').length;
    byClass.set(sheet.classId, entry);
  }
  return [...byClass.entries()]
    .map(([classId, entry]) => ({
      classId,
      className: entry.className,
      courseName: entry.courseName,
      present: entry.present,
      total: entry.total,
      rate: entry.total === 0 ? 0 : Math.round((entry.present / entry.total) * 100),
    }))
    .sort((a, b) => b.rate - a.rate || a.classId - b.classId);
}

export async function loadAdminDashboard(): Promise<AdminDashboardData> {
  const [
    students,
    teachers,
    courses,
    studyingClasses,
    pendingRegistrations,
    pendingTransactions,
    successTransactions,
    attendanceSheets,
  ] = await Promise.all([
    usersApi.getUsers({ role: 'STUDENT' }),
    usersApi.getUsers({ role: 'TEACHER' }),
    coursesApi.getCourses(),
    classesApi.getClasses({ status: 'STUDYING' }),
    registrationsApi.getRegistrations({ status: 'PENDING' }),
    transactionsApi.getTransactions({ status: 'PENDING_CONFIRMATION' }),
    transactionsApi.getTransactions({ status: 'SUCCESS' }),
    attendanceApi.getSheets(),
  ]);

  return {
    activeStudents: students.filter((student) => student.status === 'ACTIVE').length,
    teachers: teachers.length,
    activeCourses: courses.filter((course) => course.status === 'ACTIVE').length,
    studyingClasses: studyingClasses.length,
    currentMonthRevenue: getCurrentMonthRevenue(successTransactions),
    pendingRegistrations: pendingRegistrations.slice(0, 5),
    pendingTransactions: pendingTransactions.slice(0, 5),
    revenueByMonth: aggregateRevenueByMonth(successTransactions),
    newStudentsByMonth: aggregateNewStudentsByMonth(students),
    attendanceByClass: aggregateAttendanceByClass(attendanceSheets),
  };
}

export async function loadTeacherDashboard(userId: number): Promise<TeacherDashboardData> {
  const [classes, weeklySessions, unreadNotifications] = await Promise.all([
    classesApi.getClasses({ teacherId: userId }),
    schedulesApi.getSchedules({ from: startOfWeek(), to: endOfWeek() }),
    notificationsApi.getUnreadCount(),
  ]);

  return {
    studyingClasses: classes.filter((courseClass) => courseClass.status === 'STUDYING').length,
    totalClasses: classes.length,
    weeklySessions: sortSchedules(weeklySessions),
    unreadNotifications,
  };
}

export async function loadStudentDashboard(userId: number): Promise<StudentDashboardData> {
  const [registrations, weeklySessions, unreadNotifications] = await Promise.all([
    registrationsApi.getRegistrations({ studentId: userId }),
    schedulesApi.getSchedules({ from: startOfWeek(), to: endOfWeek() }),
    notificationsApi.getUnreadCount(),
  ]);

  const pending = registrations.filter((registration) => registration.status === 'PENDING');

  return {
    myCourses: registrations.filter(
      (registration) => registration.status === 'APPROVED' || registration.status === 'PAID',
    ),
    pendingRegistrationCount: pending.length,
    pendingRegistrations: pending.slice(0, 5),
    weeklySessions: sortSchedules(weeklySessions),
    unreadNotifications,
  };
}

export function buildAdminStats(data: AdminDashboardData): DashboardStat[] {
  return [
    { key: 'students', label: 'Học viên đang hoạt động', value: data.activeStudents },
    { key: 'teachers', label: 'Giáo viên', value: data.teachers },
    { key: 'courses', label: 'Khóa học đang mở', value: data.activeCourses },
    { key: 'classes', label: 'Lớp đang học', value: data.studyingClasses },
    {
      key: 'currentMonthRevenue',
      label: 'Doanh thu tháng này',
      value: data.currentMonthRevenue,
      formatter: formatVnd,
    },
  ];
}

export function buildTeacherStats(data: TeacherDashboardData): DashboardStat[] {
  return [
    { key: 'classes', label: 'Lớp đang dạy', value: data.studyingClasses },
    { key: 'totalClasses', label: 'Tổng lớp được phân công', value: data.totalClasses },
    { key: 'weeklySessions', label: 'Buổi học tuần này', value: data.weeklySessions.length },
    { key: 'notifications', label: 'Thông báo chưa đọc', value: data.unreadNotifications },
  ];
}

export function buildStudentStats(data: StudentDashboardData): DashboardStat[] {
  return [
    { key: 'myCourses', label: 'Khóa học của tôi', value: data.myCourses.length },
    { key: 'weeklySessions', label: 'Buổi học tuần này', value: data.weeklySessions.length },
    { key: 'pendingRegistrations', label: 'Đăng ký chờ duyệt', value: data.pendingRegistrationCount },
    { key: 'notifications', label: 'Thông báo chưa đọc', value: data.unreadNotifications },
  ];
}
