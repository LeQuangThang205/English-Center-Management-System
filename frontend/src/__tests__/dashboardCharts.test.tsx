import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AppRoutes } from '@/routes/AppRoutes';
import { authStorage } from '@/features/auth/authStorage';
import {
  aggregateAttendanceByClass,
  aggregateNewStudentsByMonth,
  aggregateRevenueByMonth,
  currentMonthKey,
  getCurrentMonthRevenue,
} from '@/features/dashboard/dashboardData';
import type { AttendanceSheet, AttendanceStatus } from '@/types/attendance';
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

function successTransaction(
  id: number,
  amount: number,
  date: string,
): Transaction {
  return {
    id,
    registrationId: id,
    studentId: 7,
    studentName: 'Nguyễn Văn An',
    classId: 3,
    className: 'Beginner Class B',
    courseName: 'English Foundation',
    amount,
    paymentMethod: 'BANK_TRANSFER',
    transactionCode: `TXN-${String(id).padStart(6, '0')}`,
    status: 'SUCCESS',
    createdAt: date,
    paidAt: date,
  };
}

function attendanceSheet(
  id: number,
  classId: number,
  className: string,
  courseName: string,
  statuses: AttendanceStatus[],
): AttendanceSheet {
  return {
    id,
    classId,
    className,
    courseName,
    date: '2026-08-05',
    records: statuses.map((status, index) => ({
      id: id * 10 + index,
      studentId: 10 + index,
      studentName: `Học viên ${index + 1}`,
      status,
    })),
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

describe('admin chart data helpers', () => {
  it('groups SUCCESS revenue by month, sorted ascending', () => {
    const transactions = [
      successTransaction(1, 1500000, '2026-08-10T10:00:00'),
      successTransaction(2, 1800000, '2026-07-05T10:00:00'),
      successTransaction(3, 500000, '2026-06-15T10:00:00'),
    ];

    expect(aggregateRevenueByMonth(transactions)).toEqual([
      { key: '2026-06', label: '06/2026', value: 500000 },
      { key: '2026-07', label: '07/2026', value: 1800000 },
      { key: '2026-08', label: '08/2026', value: 1500000 },
    ]);
  });

  it('ignores non-SUCCESS transactions and transactions without a date', () => {
    const transactions: Transaction[] = [
      successTransaction(1, 1500000, '2026-08-10T10:00:00'),
      {
        ...successTransaction(2, 2000000, '2026-08-01T10:00:00'),
        status: 'PENDING_CONFIRMATION',
      },
      {
        ...successTransaction(3, 3000000, '2026-08-01T10:00:00'),
        status: 'FAILED',
      },
      { ...successTransaction(4, 4000000, '2026-08-01T10:00:00'), paidAt: null, createdAt: null },
    ];

    expect(aggregateRevenueByMonth(transactions)).toEqual([
      { key: '2026-08', label: '08/2026', value: 1500000 },
    ]);
  });

  it('returns an empty array for an empty revenue dataset', () => {
    expect(aggregateRevenueByMonth([])).toEqual([]);
  });

  it('counts students by creation month, sorted ascending', () => {
    const users: User[] = [
      { ...studentUser, createdAt: '2026-08-01T09:00:00' },
      { ...studentUser, id: 8, createdAt: '2026-07-20T09:00:00' },
      { ...studentUser, id: 9, createdAt: '2026-07-10T09:00:00' },
      { ...studentUser, id: 10, createdAt: null },
    ];

    expect(aggregateNewStudentsByMonth(users)).toEqual([
      { key: '2026-07', label: '07/2026', value: 2 },
      { key: '2026-08', label: '08/2026', value: 1 },
    ]);
  });

  it('returns an empty array for an empty or dateless student dataset', () => {
    expect(aggregateNewStudentsByMonth([])).toEqual([]);
    expect(aggregateNewStudentsByMonth([{ ...studentUser, createdAt: null }])).toEqual([]);
  });

  it('computes the present rate per class and sorts descending', () => {
    const sheets: AttendanceSheet[] = [
      attendanceSheet(1, 3, 'Beginner Class B', 'English Foundation', [
        'PRESENT',
        'PRESENT',
      ]),
      attendanceSheet(2, 3, 'Beginner Class B', 'English Foundation', [
        'ABSENT',
        'PRESENT',
      ]),
      attendanceSheet(3, 4, 'Intermediate Class A', 'English Communication', [
        'PRESENT',
        'PRESENT',
        'PRESENT',
        'PRESENT',
      ]),
    ];

    expect(aggregateAttendanceByClass(sheets)).toEqual([
      {
        classId: 4,
        className: 'Intermediate Class A',
        courseName: 'English Communication',
        rate: 100,
        present: 4,
        total: 4,
      },
      {
        classId: 3,
        className: 'Beginner Class B',
        courseName: 'English Foundation',
        rate: 75,
        present: 3,
        total: 4,
      },
    ]);
  });

  it('rounds fractional attendance rates and returns empty array for empty dataset', () => {
    const sheets: AttendanceSheet[] = [
      attendanceSheet(1, 3, 'Beginner Class B', 'English Foundation', [
        'PRESENT',
        'PRESENT',
        'ABSENT',
      ]),
    ];

    expect(aggregateAttendanceByClass(sheets)[0].rate).toBe(67);
    expect(aggregateAttendanceByClass([])).toEqual([]);
  });
});

describe('current month revenue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-19T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the SUCCESS revenue of the current month only', () => {
    const transactions = [
      successTransaction(1, 1500000, '2026-08-10T10:00:00'),
      successTransaction(2, 1800000, '2026-07-05T10:00:00'),
    ];

    expect(currentMonthKey()).toBe('2026-08');
    expect(getCurrentMonthRevenue(transactions)).toBe(1500000);
  });

  it('returns 0 when the current month has no SUCCESS revenue', () => {
    expect(getCurrentMonthRevenue([])).toBe(0);
    expect(getCurrentMonthRevenue([successTransaction(1, 1500000, '2026-07-10T10:00:00')])).toBe(0);
  });
});

describe('admin dashboard charts', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the three charts with aggregated values', async () => {
    authStorage.setSession('jwt.admin', adminUser);

    const urlResponses: Record<string, unknown> = {
      '/users?role=STUDENT': [
        { ...studentUser, createdAt: '2026-08-01T09:00:00' },
        { ...studentUser, id: 8, fullName: 'Trần Thị Bình', createdAt: '2026-08-05T09:00:00' },
      ],
      '/users?role=TEACHER': [teacherUser],
      '/courses': [],
      '/classes?status=STUDYING': [],
      '/registrations?status=PENDING': [],
      '/transactions?status=PENDING_CONFIRMATION': [],
      '/transactions?status=SUCCESS': [
        successTransaction(3, 1500000, '2026-08-10T10:00:00'),
        successTransaction(5, 1800000, '2026-08-12T10:00:00'),
      ],
      '/attendance/sheets': [
        attendanceSheet(1, 3, 'Beginner Class B', 'English Foundation', [
          'PRESENT',
          'PRESENT',
        ]),
        attendanceSheet(2, 3, 'Beginner Class B', 'English Foundation', [
          'ABSENT',
          'PRESENT',
        ]),
      ],
    };

    mockApi(respondFrom(urlResponses));
    renderDashboard('/admin/dashboard');

    expect(await screen.findByText('Doanh thu theo tháng')).toBeTruthy();
    expect(screen.getByText('Học viên mới theo tháng')).toBeTruthy();
    expect(screen.getByText('Tỷ lệ chuyên cần theo lớp')).toBeTruthy();
    expect(screen.getByText('Doanh thu tháng này')).toBeTruthy();
    expect(screen.getAllByText('08/2026').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('3.300.000 ₫').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Beginner Class B')).toBeTruthy();
    expect(screen.getByText('75%')).toBeTruthy();
    expect(screen.getByText('English Foundation · 3/4 lượt có mặt')).toBeTruthy();
  });

  it('shows empty states when chart datasets are empty', async () => {
    authStorage.setSession('jwt.admin', adminUser);

    const urlResponses: Record<string, unknown> = {
      '/users?role=STUDENT': [],
      '/users?role=TEACHER': [],
      '/courses': [],
      '/classes?status=STUDYING': [],
      '/registrations?status=PENDING': [],
      '/transactions?status=PENDING_CONFIRMATION': [],
      '/transactions?status=SUCCESS': [],
      '/attendance/sheets': [],
    };

    mockApi(respondFrom(urlResponses));
    renderDashboard('/admin/dashboard');

    expect(await screen.findByText('Chưa có doanh thu')).toBeTruthy();
    expect(screen.getByText('Chưa có học viên mới')).toBeTruthy();
    expect(screen.getByText('Chưa có dữ liệu điểm danh')).toBeTruthy();
  });

  it('does not crash on failure and shows the error state for every role', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ success: false, message: 'Internal server error' }),
        }),
      ),
    );

    const adminView = renderDashboard('/admin/dashboard');
    expect(await screen.findByText('Không thể tải dữ liệu dashboard')).toBeTruthy();
    adminView.unmount();
    vi.unstubAllGlobals();

    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ success: false, message: 'Internal server error' }),
        }),
      ),
    );
    const teacherView = renderDashboard('/teacher/dashboard');
    expect(await screen.findByText('Không thể tải dữ liệu dashboard')).toBeTruthy();
    teacherView.unmount();
    vi.unstubAllGlobals();

    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ success: false, message: 'Internal server error' }),
        }),
      ),
    );
    const studentView = renderDashboard('/student/dashboard');
    expect(await screen.findByText('Không thể tải dữ liệu dashboard')).toBeTruthy();
    studentView.unmount();
  });
});

describe('teacher and student dashboards stay unchanged', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the teacher dashboard without fetching admin chart endpoints', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);

    const teacherClasses: CourseClass[] = [
      {
        id: 3,
        courseId: 1,
        courseName: 'IELTS 6.0',
        name: 'IELTS 6.0-01',
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
    const table: Record<string, unknown> = {
      '/classes?teacherId=2': teacherClasses,
      '/schedules': schedules,
      '/notifications/unread/count': 3,
    };

    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input).replace('/api', '');
      const data = Object.keys(table).find((key) => url.startsWith(key))
        ? table[Object.keys(table).find((key) => url.startsWith(key))!]
        : undefined;
      return Promise.resolve({
        ok: data !== undefined,
        status: data !== undefined ? 200 : 404,
        json: () => Promise.resolve({ success: data !== undefined, data, message: 'OK' }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    renderDashboard('/teacher/dashboard');
    expect(await screen.findByText('Lớp đang dạy')).toBeTruthy();

    const calls = fetchMock.mock.calls.map(([input]) => String(input).replace('/api', ''));
    expect(calls.some((url) => url.startsWith('/attendance/sheets'))).toBe(false);
    expect(calls.some((url) => url.startsWith('/transactions'))).toBe(false);
    expect(calls.some((url) => url.startsWith('/users'))).toBe(false);
  });

  it('renders the student dashboard without fetching admin chart endpoints', async () => {
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
    const table: Record<string, unknown> = {
      '/registrations?studentId=7': registrations,
      '/schedules': schedules,
      '/notifications/unread/count': 2,
    };

    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input).replace('/api', '');
      const data = Object.keys(table).find((key) => url.startsWith(key))
        ? table[Object.keys(table).find((key) => url.startsWith(key))!]
        : undefined;
      return Promise.resolve({
        ok: data !== undefined,
        status: data !== undefined ? 200 : 404,
        json: () => Promise.resolve({ success: data !== undefined, data, message: 'OK' }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    renderDashboard('/student/dashboard');
    expect(await screen.findByText('Thông báo chưa đọc')).toBeTruthy();

    const calls = fetchMock.mock.calls.map(([input]) => String(input).replace('/api', ''));
    expect(calls.some((url) => url.startsWith('/attendance/sheets'))).toBe(false);
    expect(calls.some((url) => url.startsWith('/transactions'))).toBe(false);
    expect(calls.some((url) => url.startsWith('/users'))).toBe(false);
  });
});