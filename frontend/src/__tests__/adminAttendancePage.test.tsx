import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AppRoutes } from '@/routes/AppRoutes';
import { authStorage } from '@/features/auth/authStorage';
import type { AttendanceSheet } from '@/types/attendance';
import type { CourseClass } from '@/types/courseClass';
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
  role: 'ADMIN',
  email: 'admin@example.com',
  fullName: 'Quản Trị Viên',
};

function makeClass(overrides: Partial<CourseClass> & { id: number }): CourseClass {
  return {
    courseId: 1,
    courseName: 'English Foundation',
    name: `Lớp ${overrides.id}`,
    teacherId: 5,
    teacherName: 'Trần Văn Bình',
    maxCapacity: 20,
    currentHeadcount: 5,
    scheduleDay: 'TUE',
    startTime: '18:00:00',
    endTime: '20:00:00',
    room: 'B201',
    startDate: '2026-09-01',
    endDate: '2026-12-15',
    status: 'STUDYING',
    ...overrides,
  };
}

function makeSheet(overrides: Partial<AttendanceSheet> & { id: number }): AttendanceSheet {
  return {
    classId: 3,
    className: 'Beginner Class B',
    courseName: 'English Foundation',
    date: '2026-09-10',
    createdById: 5,
    createdByName: 'Trần Văn Bình',
    records: [],
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

const classA = makeClass({ id: 3, name: 'Beginner Class B' });
const classB = makeClass({
  id: 4,
  name: 'Intermediate Class A',
  courseId: 2,
  courseName: 'English Communication',
});

const sheetFull = makeSheet({
  id: 1,
  records: [
    { id: 11, studentId: 10, studentName: 'Nguyễn Văn An', status: 'PRESENT' },
    { id: 12, studentId: 11, studentName: 'Trần Thị Bình', status: 'PRESENT' },
    { id: 13, studentId: 12, studentName: 'Lê Văn Cường', status: 'ABSENT' },
    { id: 14, studentId: 13, studentName: 'Phạm Thị Dung', status: 'EXCUSED' },
  ],
});

const sheetEmpty = makeSheet({
  id: 2,
  classId: 4,
  className: 'Intermediate Class A',
  courseName: 'English Communication',
  date: '2026-09-11',
  createdById: null,
  createdByName: null,
  records: [],
});

interface MockResponse {
  ok: boolean;
  status: number;
  body: unknown;
}

function createFetchMock(handler: (url: string, method: string) => MockResponse) {
  return vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input).replace('/api', '');
    const method = init?.method ?? 'GET';
    const result = handler(url, method);
    return Promise.resolve({
      ok: result.ok,
      status: result.status,
      json: () =>
        result.status === 204
          ? Promise.reject(new Error('No content'))
          : Promise.resolve(result.body),
    });
  });
}

const success = (data: unknown): MockResponse => ({
  ok: true,
  status: 200,
  body: { success: true, data, message: 'OK' },
});

const failure = (): MockResponse => ({
  ok: false,
  status: 500,
  body: { success: false, message: 'Internal server error' },
});

function attendanceRouter(classes: CourseClass[], sheets: AttendanceSheet[]) {
  return (url: string): MockResponse => {
    if (url === '/notifications/unread/count') return success(0);
    if (url === '/classes' || url.startsWith('/classes?')) return success(classes);
    if (url === '/attendance/sheets' || url.startsWith('/attendance/sheets?')) return success(sheets);
    return failure();
  };
}

function renderAdminAttendance(path = '/admin/attendance') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

function attendanceCalls(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.filter(([input]) => String(input).includes('/attendance/sheets'));
}

describe('AdminAttendancePage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('redirects unauthenticated users to login', async () => {
    vi.stubGlobal('fetch', createFetchMock(attendanceRouter([classA], [sheetFull])));

    renderAdminAttendance();

    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeTruthy();
  });

  it('renders page header with title and description', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(attendanceRouter([classA, classB], [sheetFull])));

    renderAdminAttendance();

    expect(await screen.findByRole('heading', { name: 'Điểm danh' })).toBeTruthy();
    expect(await screen.findByText('Xem phiếu điểm danh trên toàn hệ thống.')).toBeTruthy();
  });

  it('loads classes and requests all sheets by default without filters', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    const fetchMock = createFetchMock(attendanceRouter([classA, classB], [sheetFull]));
    vi.stubGlobal('fetch', fetchMock);

    renderAdminAttendance();

    await screen.findByText('Beginner Class B');

    const sheetsCall = fetchMock.mock.calls.find(
      ([input]) => String(input).split('?')[0].endsWith('/attendance/sheets'),
    );
    expect(sheetsCall).toBeTruthy();
    expect(String(sheetsCall![0])).not.toContain('classId');
    expect(String(sheetsCall![0])).not.toContain('date=');

    const classesCall = fetchMock.mock.calls.find(([input]) => String(input).includes('/classes'));
    expect(classesCall).toBeTruthy();
  });

  it('renders table rows with counts and total', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(attendanceRouter([classA], [sheetFull])));

    renderAdminAttendance();

    await screen.findByText('Beginner Class B');
    const row = screen.getByText('Beginner Class B').closest('tr');
    expect(row).not.toBeNull();
    const cells = within(row as HTMLElement).getAllByRole('cell');
    // Có mặt=2, Vắng=1, Phép=1, Tổng=4
    expect(cells[3].textContent).toBe('2');
    expect(cells[4].textContent).toBe('1');
    expect(cells[5].textContent).toBe('1');
    expect(cells[6].textContent).toBe('4');
    expect(within(row as HTMLElement).getByText('English Foundation')).toBeTruthy();
    expect(within(row as HTMLElement).getByText('Trần Văn Bình')).toBeTruthy();
  });

  it('renders zero counts for a sheet without records and dash for null creator', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(attendanceRouter([classB], [sheetEmpty])));

    renderAdminAttendance();

    await screen.findByText('Intermediate Class A');
    const row = screen.getByText('Intermediate Class A').closest('tr');
    expect(row).not.toBeNull();
    const cells = within(row as HTMLElement).getAllByRole('cell');
    expect(cells[3].textContent).toBe('0');
    expect(cells[4].textContent).toBe('0');
    expect(cells[5].textContent).toBe('0');
    expect(cells[6].textContent).toBe('0');
    expect(within(row as HTMLElement).getByText('—')).toBeTruthy();
  });

  it('refetches sheets server-side when changing class filter', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    const fetchMock = createFetchMock(attendanceRouter([classA, classB], [sheetFull]));
    vi.stubGlobal('fetch', fetchMock);

    renderAdminAttendance();

    await screen.findByText('Beginner Class B');

    fireEvent.change(screen.getByLabelText('Lọc theo lớp học'), {
      target: { value: '3' },
    });

    await waitFor(() => {
      const filtered = fetchMock.mock.calls.filter(([input]) =>
        String(input).includes('/attendance/sheets?classId=3'),
      );
      expect(filtered.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('refetches sheets server-side when changing date filter', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    const fetchMock = createFetchMock(attendanceRouter([classA], [sheetFull]));
    vi.stubGlobal('fetch', fetchMock);

    renderAdminAttendance();

    await screen.findByText('Beginner Class B');

    fireEvent.change(screen.getByLabelText('Lọc theo ngày'), {
      target: { value: '2026-09-10' },
    });

    await waitFor(() => {
      const filtered = fetchMock.mock.calls.filter(([input]) =>
        String(input).includes('date=2026-09-10'),
      );
      expect(filtered.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('sends both classId and date when both filters are selected', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    const fetchMock = createFetchMock(attendanceRouter([classA, classB], [sheetFull]));
    vi.stubGlobal('fetch', fetchMock);

    renderAdminAttendance();

    await screen.findByText('Beginner Class B');

    fireEvent.change(screen.getByLabelText('Lọc theo lớp học'), {
      target: { value: '3' },
    });

    await waitFor(() => {
      const filtered = fetchMock.mock.calls.filter(([input]) =>
        String(input).includes('classId=3'),
      );
      expect(filtered.length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.change(screen.getByLabelText('Lọc theo ngày'), {
      target: { value: '2026-09-10' },
    });

    await waitFor(() => {
      const both = fetchMock.mock.calls.filter(
        ([input]) =>
          String(input).includes('classId=3') && String(input).includes('date=2026-09-10'),
      );
      expect(both.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('clears filters and requests sheets without params', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    const fetchMock = createFetchMock(attendanceRouter([classA], [sheetFull]));
    vi.stubGlobal('fetch', fetchMock);

    renderAdminAttendance();

    await screen.findByText('Beginner Class B');

    fireEvent.change(screen.getByLabelText('Lọc theo ngày'), {
      target: { value: '2026-09-10' },
    });
    await screen.findByRole('button', { name: 'Xóa lọc' });
    fireEvent.click(screen.getByRole('button', { name: 'Xóa lọc' }));

    await waitFor(() => {
      const plain = fetchMock.mock.calls.filter(
        ([input]) => String(input).split('?')[0].endsWith('/attendance/sheets'),
      );
      const lastPlain = plain[plain.length - 1];
      expect(lastPlain).toBeTruthy();
      expect(String(lastPlain[0])).not.toContain('classId');
      expect(String(lastPlain[0])).not.toContain('date=');
    });
  });

  it('shows system-wide empty state when there are no sheets', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(attendanceRouter([classA], [])));

    renderAdminAttendance();

    expect(await screen.findByText('Chưa có phiếu điểm danh nào')).toBeTruthy();
  });

  it('shows filtered empty state when filters yield no sheets', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(attendanceRouter([classA, classB], [])));

    renderAdminAttendance();

    await screen.findByText('Chưa có phiếu điểm danh nào');

    fireEvent.change(screen.getByLabelText('Lọc theo lớp học'), {
      target: { value: '3' },
    });

    expect(await screen.findByText('Không tìm thấy phiếu điểm danh')).toBeTruthy();
  });

  it('shows error state and refetches when retrying', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ success: false, message: 'Internal server error' }),
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    renderAdminAttendance();

    expect(await screen.findByText('Không thể tải phiếu điểm danh')).toBeTruthy();

    vi.stubGlobal('fetch', createFetchMock(attendanceRouter([classA], [sheetFull])));
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Beginner Class B')).toBeTruthy();
  });

  it('shows loading skeleton while fetching', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    let resolveClasses: (value: unknown) => void;
    let resolveSheets: (value: unknown) => void;
    const classesPromise = new Promise((resolve) => {
      resolveClasses = resolve;
    });
    const sheetsPromise = new Promise((resolve) => {
      resolveSheets = resolve;
    });
    const ok = (data: unknown) => ({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data, message: 'OK' }),
    });
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input).replace('/api', '');
      if (url === '/notifications/unread/count') {
        return Promise.resolve(ok(0));
      }
      if (url.startsWith('/classes')) {
        return classesPromise;
      }
      if (url.startsWith('/attendance/sheets')) {
        return sheetsPromise;
      }
      return Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ success: false, message: 'Internal server error' }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    renderAdminAttendance();

    expect(screen.getByRole('status', { name: 'Đang tải phiếu điểm danh' })).toBeTruthy();
    expect(screen.getAllByTestId('skeleton-row').length).toBeGreaterThanOrEqual(4);

    resolveClasses!(ok([classA]));
    resolveSheets!(ok([sheetFull]));
    await Promise.all([classesPromise, sheetsPromise]);

    await screen.findByText('Beginner Class B');
    expect(screen.queryByRole('status', { name: 'Đang tải phiếu điểm danh' })).toBeNull();
  });

  it('opens detail modal from list data without fetching sheet detail', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    const fetchMock = createFetchMock(attendanceRouter([classA], [sheetFull]));
    vi.stubGlobal('fetch', fetchMock);

    renderAdminAttendance();

    await screen.findByText('Beginner Class B');
    const row = screen.getByText('Beginner Class B').closest('tr');
    fireEvent.click(within(row as HTMLElement).getByRole('button', { name: 'Xem' }));

    await screen.findByRole('dialog');
    expect(screen.getByText('Nguyễn Văn An')).toBeTruthy();
    expect(screen.getByText('Trần Thị Bình')).toBeTruthy();
    expect(screen.getByText('Lê Văn Cường')).toBeTruthy();
    expect(screen.getByText('Phạm Thị Dung')).toBeTruthy();

    const detailCalls = attendanceCalls(fetchMock).filter(([input]) =>
      /\/attendance\/sheets\/\d+/.test(String(input)),
    );
    expect(detailCalls.length).toBe(0);
  });

  it('renders PRESENT, ABSENT and EXCUSED badges in detail modal', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(attendanceRouter([classA], [sheetFull])));

    renderAdminAttendance();

    await screen.findByText('Beginner Class B');
    const row = screen.getByText('Beginner Class B').closest('tr');
    fireEvent.click(within(row as HTMLElement).getByRole('button', { name: 'Xem' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getAllByText('Có mặt').length).toBeGreaterThanOrEqual(2);
    expect(within(dialog).getByText('Vắng')).toBeTruthy();
    expect(within(dialog).getByText('Phép')).toBeTruthy();
  });

  it('renders AdminAttendancePage for /admin/attendance instead of PlaceholderPage', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(attendanceRouter([classA], [sheetFull])));

    renderAdminAttendance();

    expect(await screen.findByRole('heading', { name: 'Điểm danh' })).toBeTruthy();
    expect(screen.queryByText('Chức năng sẽ được triển khai ở các bước tiếp theo.')).toBeNull();
  });

  it('does not render create, edit or delete controls and never writes', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    const fetchMock = createFetchMock(attendanceRouter([classA], [sheetFull]));
    vi.stubGlobal('fetch', fetchMock);

    renderAdminAttendance();

    await screen.findByText('Beginner Class B');
    expect(screen.queryByRole('button', { name: 'Thêm' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Tạo' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Sửa' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Lưu' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Xóa' })).toBeNull();

    // Mở modal cũng không được tạo write request
    const row = screen.getByText('Beginner Class B').closest('tr');
    fireEvent.click(within(row as HTMLElement).getByRole('button', { name: 'Xem' }));
    await screen.findByRole('dialog');

    const nonGet = fetchMock.mock.calls.filter(
      ([, init]) => ((init as RequestInit | undefined)?.method ?? 'GET') !== 'GET',
    );
    expect(nonGet.length).toBe(0);
    const attendanceWrites = fetchMock.mock.calls.filter(
      ([input, init]) =>
        String(input).includes('/attendance') &&
        ((init as RequestInit | undefined)?.method ?? 'GET') !== 'GET',
    );
    expect(attendanceWrites.length).toBe(0);
  });
});
