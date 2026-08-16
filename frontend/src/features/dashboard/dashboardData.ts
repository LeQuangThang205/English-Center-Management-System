import { classesApi } from '@/services/api/classesApi';
import { coursesApi } from '@/services/api/coursesApi';
import { notificationsApi } from '@/services/api/notificationsApi';
import { registrationsApi } from '@/services/api/registrationsApi';
import { schedulesApi } from '@/services/api/schedulesApi';
import { transactionsApi } from '@/services/api/transactionsApi';
import { usersApi } from '@/services/api/usersApi';
import type { ScheduleDay } from '@/types/courseClass';
import type { Schedule } from '@/types/schedule';
import type {
  AdminDashboardData,
  DashboardStat,
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

export async function loadAdminDashboard(): Promise<AdminDashboardData> {
  const [students, teachers, courses, studyingClasses, pendingRegistrations, pendingTransactions] =
    await Promise.all([
      usersApi.getUsers({ role: 'STUDENT', status: 'ACTIVE' }),
      usersApi.getUsers({ role: 'TEACHER' }),
      coursesApi.getCourses(),
      classesApi.getClasses({ status: 'STUDYING' }),
      registrationsApi.getRegistrations({ status: 'PENDING' }),
      transactionsApi.getTransactions({ status: 'PENDING_CONFIRMATION' }),
    ]);

  return {
    activeStudents: students.length,
    teachers: teachers.length,
    activeCourses: courses.filter((course) => course.status === 'ACTIVE').length,
    studyingClasses: studyingClasses.length,
    pendingRegistrations: pendingRegistrations.slice(0, 5),
    pendingTransactions: pendingTransactions.slice(0, 5),
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
