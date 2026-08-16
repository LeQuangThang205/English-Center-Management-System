import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AppRoutes } from '@/routes/AppRoutes';
import { authStorage } from '@/features/auth/authStorage';
import {
  buildAdminStats,
  buildStudentStats,
  buildTeacherStats,
  endOfWeek,
  sortSchedules,
  startOfWeek,
} from '@/features/dashboard/dashboardData';
import type {
  AdminDashboardData,
  StudentDashboardData,
  TeacherDashboardData,
} from '@/features/dashboard/types';
import type { Course } from '@/types/course';
import type { CourseClass } from '@/types/courseClass';
import type { Registration } from '@/types/registration';
import type { Schedule } from '@/types/schedule';
import type { Transaction } from '@/types/transaction';
import type { User } from '@/types/user';

const baseUser: Omit<User, 'role' | 'email' | 'fullName'> = {
  id: 1,
  phone: null,
  status: 'ACTIVE',
  avatarUrl: null,
  emailVerifiedAt: null,
  lastLoginAt: null,
  createdAt: null,
  updatedAt: null,
};

const adminUser: User = {
  ...baseUser,
  id: 1,
  role: 'ADMIN',
  email: 'admin@example.com',
  fullName: 'Quản trị viên',
};

const teacherUser: User = {
  ...baseUser,
  id: 2,
  role: 'TEACHER',
  email: 'teacher1@example.com',
  fullName: 'Cô Hà',
};

const studentUser: User = {
  ...baseUser,
  id: 7,
  role: 'STUDENT',
  email: 'student1@example.com',
  fullName: 'Nguyễn Văn An',
};

function baseClass(overrides: Partial<CourseClass> & { id: number; name: string }): CourseClass {
  return {
    courseId: 1,
    courseName: 'IELTS 6.0',
    teacherId: 2,
    teacherName: 'Cô Hà',
    maxCapacity: 12,
    currentHeadcount: 10,
    scheduleDay: 'WED',
    startTime: '18:00',
    endTime: '20:30',
    room: 'A201',
    startDate: '2026-08-01',
    endDate: '2026-11-30',
    status: 'STUDYING',
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

function mockApi(respond: (url: string) => unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input).replace('/api', '');
      const data = respond(url);
      return Promise.resolve({
        ok: data !== undefined,
        status: data !== undefined ? 200 : 404,
        json: () =>
          Promise.resolve({
            success: data !== undefined,
            data: data ?? undefined,
            message: data !== undefined ? 'OK' : 'Not found',
          }),
      });
    }),
  );
}

function respondFrom(table: Record<string, unknown>) {
  return (url: string) => {
    for (const key of Object.keys(table)) {
      if (url.startsWith(key)) return table[key];
    }
    return undefined;
  };
}

function renderDashboard(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('dashboard data helpers', () => {
  it('computes the Monday–Sunday range of the current week', () => {
    expect(startOfWeek(new Date(2026, 7, 19))).toBe('2026-08-17');
    expect(endOfWeek(new Date(2026, 7, 19))).toBe('2026-08-23');
    expect(startOfWeek(new Date(2026, 7, 16))).toBe('2026-08-10');
    expect(endOfWeek(new Date(2026, 7, 16))).toBe('2026-08-16');
  });

  it('sorts schedules by day order then start time', () => {
    const schedules: Schedule[] = [
      {
        classId: 2,
        className: 'Lớp thứ tư',
        courseName: 'IELTS 6.0',
        scheduleDay: 'WED',
        startTime: '18:30',
        endTime: '20:30',
        room: 'A201',
        startDate: '2026-08-01',
        endDate: '2026-11-30',
      },
      {
        classId: 1,
        className: 'Lớp thứ hai tối',
        courseName: 'IELTS 6.0',
        scheduleDay: 'MON',
        startTime: '19:00',
        endTime: '21:00',
        room: 'A101',
        startDate: '2026-08-01',
        endDate: '2026-11-30',
      },
      {
        classId: 3,
        className: 'Lớp thứ hai sáng',
        courseName: 'IELTS 6.0',
        scheduleDay: 'MON',
        startTime: '08:00',
        endTime: '10:00',
        room: 'A101',
        startDate: '2026-08-01',
        endDate: '2026-11-30',
      },
    ];

    const sorted = sortSchedules(schedules);
    expect(sorted.map((item) => item.classId)).toEqual([3, 1, 2]);
  });

  it('builds admin stats', () => {
    const data: AdminDashboardData = {
      activeStudents: 12,
      teachers: 3,
      activeCourses: 5,
      studyingClasses: 4,
      pendingRegistrations: [],
      pendingTransactions: [],
    };

    expect(buildAdminStats(data)).toEqual([
      { key: 'students', label: 'Học viên đang hoạt động', value: 12 },
      { key: 'teachers', label: 'Giáo viên', value: 3 },
      { key: 'courses', label: 'Khóa học đang mở', value: 5 },
      { key: 'classes', label: 'Lớp đang học', value: 4 },
    ]);
  });

  it('builds teacher stats', () => {
    const data: TeacherDashboardData = {
      studyingClasses: 2,
      totalClasses: 3,
      weeklySessions: [],
      unreadNotifications: 4,
    };

    expect(buildTeacherStats(data)).toEqual([
      { key: 'classes', label: 'Lớp đang dạy', value: 2 },
      { key: 'totalClasses', label: 'Tổng lớp được phân công', value: 3 },
      { key: 'weeklySessions', label: 'Buổi học tuần này', value: 0 },
      { key: 'notifications', label: 'Thông báo chưa đọc', value: 4 },
    ]);
  });

  it('builds student stats', () => {
    const data: StudentDashboardData = {
      myCourses: [],
      pendingRegistrationCount: 1,
      pendingRegistrations: [],
      weeklySessions: [],
      unreadNotifications: 2,
    };

    expect(buildStudentStats(data)).toEqual([
      { key: 'myCourses', label: 'Khóa học của tôi', value: 0 },
      { key: 'weeklySessions', label: 'Buổi học tuần này', value: 0 },
      { key: 'pendingRegistrations', label: 'Đăng ký chờ duyệt', value: 1 },
      { key: 'notifications', label: 'Thông báo chưa đọc', value: 2 },
    ]);
  });
});

describe('dashboard page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the admin dashboard with aggregated stats and pending items', async () => {
    authStorage.setSession('jwt.admin', adminUser);

    const students: User[] = [studentUser, { ...studentUser, id: 8, fullName: 'Trần Thị Bình' }];
    const teachers: User[] = [teacherUser, { ...teacherUser, id: 9, fullName: 'Thầy Minh' }];
    const courses: Course[] = [
      {
        id: 1,
        name: 'IELTS 6.0',
        description: null,
        tuition: 5000000,
        level: 'INTERMEDIATE',
        duration: 12,
        status: 'ACTIVE',
        createdAt: null,
        updatedAt: null,
      },
      {
        id: 2,
        name: 'Giao tiếp A1',
        description: null,
        tuition: 4000000,
        level: 'BEGINNER',
        duration: 10,
        status: 'DELETED',
        createdAt: null,
        updatedAt: null,
      },
    ];
    const studyingClasses: CourseClass[] = [
      baseClass({ id: 3, name: 'IELTS 6.0-01' }),
      baseClass({ id: 4, name: 'IELTS 6.0-02' }),
      baseClass({ id: 5, name: 'IELTS 6.0-03' }),
    ];
    const pendingRegistrations: Registration[] = [
      {
        id: 1,
        studentId: 7,
        studentName: 'Nguyễn Văn An',
        classId: 3,
        className: 'IELTS 6.0-01',
        courseName: 'IELTS 6.0',
        status: 'PENDING',
        tuitionAtRegistration: 5000000,
        registeredAt: '2026-08-15T09:00:00',
        createdAt: null,
        updatedAt: null,
      },
    ];
    const pendingTransactions: Transaction[] = [
      {
        id: 11,
        registrationId: 1,
        studentId: 7,
        studentName: 'Nguyễn Văn An',
        classId: 3,
        className: 'IELTS 6.0-01',
        courseName: 'IELTS 6.0',
        amount: 5000000,
        paymentMethod: 'BANK_TRANSFER',
        transactionCode: 'TX-2026-0001',
        status: 'PENDING_CONFIRMATION',
        createdAt: '2026-08-15T10:00:00',
      },
    ];

    const urlResponses: Record<string, unknown> = {
      '/users?role=STUDENT&status=ACTIVE': students,
      '/users?role=TEACHER': teachers,
      '/courses': courses,
      '/classes?status=STUDYING': studyingClasses,
      '/registrations?status=PENDING': pendingRegistrations,
      '/transactions?status=PENDING_CONFIRMATION': pendingTransactions,
    };

    mockApi(respondFrom(urlResponses));

    renderDashboard('/admin/dashboard');

    expect(await screen.findByText('Học viên đang hoạt động')).toBeTruthy();
    expect(screen.getAllByText('Giáo viên').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Khóa học đang mở')).toBeTruthy();
    expect(screen.getByText('Lớp đang học')).toBeTruthy();

    expect(screen.getAllByText('Nguyễn Văn An').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Chờ duyệt')).toBeTruthy();
    expect(screen.getByText(/TX-2026-0001/)).toBeTruthy();
    expect(screen.getByText('5.000.000 ₫')).toBeTruthy();
  });

  it('renders the teacher dashboard with the weekly teaching schedule', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);

    const teacherClasses: CourseClass[] = [
      baseClass({ id: 1, name: 'Giao tiếp A1-01', courseName: 'Giao tiếp A1', scheduleDay: 'MON', startTime: '18:00', endTime: '20:00', room: 'A101' }),
      baseClass({ id: 3, name: 'IELTS 6.0-01' }),
      baseClass({ id: 6, name: 'IELTS 6.0-01B', status: 'FINISHED' }),
    ];
    const schedules: Schedule[] = [
      {
        classId: 3,
        className: 'IELTS 6.0-01',
        courseName: 'IELTS 6.0',
        scheduleDay: 'WED',
        startTime: '18:00',
        endTime: '20:30',
        room: 'A201',
        teacherId: 2,
        teacherName: 'Cô Hà',
        startDate: '2026-08-01',
        endDate: '2026-11-30',
      },
      {
        classId: 1,
        className: 'Giao tiếp A1-01',
        courseName: 'Giao tiếp A1',
        scheduleDay: 'MON',
        startTime: '18:00',
        endTime: '20:00',
        room: 'A101',
        teacherId: 2,
        teacherName: 'Cô Hà',
        startDate: '2026-08-01',
        endDate: '2026-11-30',
      },
    ];

    const urlResponses: Record<string, unknown> = {
      '/classes?teacherId=2': teacherClasses,
      '/schedules': schedules,
      '/notifications/unread/count': 3,
    };

    mockApi(respondFrom(urlResponses));

    renderDashboard('/teacher/dashboard');

    expect(await screen.findByText('Lớp đang dạy')).toBeTruthy();
    expect(screen.getByText('Tổng lớp được phân công')).toBeTruthy();
    expect(screen.getByText('Thông báo chưa đọc')).toBeTruthy();

    expect(screen.getByText('Thứ 2 · 18:00–20:00 · Phòng A101')).toBeTruthy();
    expect(screen.getByText('Thứ 4 · 18:00–20:30 · Phòng A201')).toBeTruthy();
  });

  it('renders the student dashboard with own registrations and schedule', async () => {
    authStorage.setSession('jwt.student', studentUser);

    const registrations: Registration[] = [
      {
        id: 1,
        studentId: 7,
        studentName: 'Nguyễn Văn An',
        classId: 3,
        className: 'IELTS 6.0-01',
        courseName: 'IELTS 6.0',
        status: 'APPROVED',
        tuitionAtRegistration: 5000000,
        registeredAt: '2026-08-01T09:00:00',
        approvedAt: '2026-08-02T10:00:00',
        createdAt: null,
        updatedAt: null,
      },
      {
        id: 2,
        studentId: 7,
        studentName: 'Nguyễn Văn An',
        classId: 1,
        className: 'Giao tiếp A1-01',
        courseName: 'Giao tiếp A1',
        status: 'PAID',
        tuitionAtRegistration: 4000000,
        registeredAt: '2026-07-20T09:00:00',
        paidAt: '2026-07-21T10:00:00',
        createdAt: null,
        updatedAt: null,
      },
      {
        id: 3,
        studentId: 7,
        studentName: 'Nguyễn Văn An',
        classId: 8,
        className: 'IELTS 7.0-01',
        courseName: 'IELTS 7.0',
        status: 'PENDING',
        tuitionAtRegistration: 6000000,
        registeredAt: '2026-08-15T09:00:00',
        createdAt: null,
        updatedAt: null,
      },
    ];
    const schedules: Schedule[] = [
      {
        classId: 3,
        className: 'IELTS 6.0-01',
        courseName: 'IELTS 6.0',
        scheduleDay: 'WED',
        startTime: '18:00',
        endTime: '20:30',
        room: 'A201',
        teacherId: 2,
        teacherName: 'Cô Hà',
        startDate: '2026-08-01',
        endDate: '2026-11-30',
      },
    ];

    const urlResponses: Record<string, unknown> = {
      '/registrations?studentId=7': registrations,
      '/schedules': schedules,
      '/notifications/unread/count': 2,
    };

    mockApi(respondFrom(urlResponses));

    renderDashboard('/student/dashboard');

    expect(await screen.findByText('Thông báo chưa đọc')).toBeTruthy();
    expect(screen.getAllByText('Khóa học của tôi').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Thứ 4 · 18:00–20:30 · Phòng A201')).toBeTruthy();
    expect(screen.getByText(/IELTS 7.0-01/)).toBeTruthy();
    expect(screen.getAllByText('Đăng ký chờ duyệt').length).toBeGreaterThanOrEqual(2);
  });

  it('shows an error state and refetches when retrying', async () => {
    authStorage.setSession('jwt.admin', adminUser);

    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ success: false, message: 'Internal server error' }),
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    renderDashboard('/admin/dashboard');

    expect(await screen.findByText('Không thể tải dữ liệu dashboard')).toBeTruthy();
    const callsBefore = fetchMock.mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });
});