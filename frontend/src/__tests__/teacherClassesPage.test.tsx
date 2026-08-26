import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AppRoutes } from '@/routes/AppRoutes';
import { authStorage } from '@/features/auth/authStorage';

import type { CourseClass } from '@/types/courseClass';
import type { User } from '@/types/user';

const baseUser: Omit<User, 'role' | 'email' | 'fullName'> = {
  id: 5,
  phone: null,
  status: 'ACTIVE',
  avatarUrl: null,
  emailVerifiedAt: null,
  lastLoginAt: null,
  createdAt: null,
  updatedAt: null,
};

const teacherUser: User = {
  ...baseUser,
  role: 'TEACHER',
  email: 'teacher1@example.com',
  fullName: 'Trần Văn Bình',
};

function makeClass(overrides: Partial<CourseClass> & { id: number }): CourseClass {
  return {
    courseId: 1,
    courseName: 'IELTS 6.0',
    name: `Lớp ${overrides.id}`,
    teacherId: 5,
    teacherName: 'Trần Văn Bình',
    maxCapacity: 20,
    currentHeadcount: 12,
    scheduleDay: 'TUE',
    startTime: '18:00',
    endTime: '20:00',
    room: 'B201',
    startDate: '2026-09-01T00:00:00',
    endDate: '2026-12-15T00:00:00',
    status: 'STUDYING',
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

const classA = makeClass({ id: 10, name: 'IELTS 6.0-01', status: 'STUDYING', currentHeadcount: 12, maxCapacity: 20, scheduleDay: 'TUE', startTime: '18:00', endTime: '20:00', room: 'B201' });
const classB = makeClass({ id: 11, name: 'IELTS 6.0-02', status: 'UPCOMING', currentHeadcount: 8, maxCapacity: 15, scheduleDay: 'THU', startTime: '19:00', endTime: '21:00', room: 'B202' });
const classC = makeClass({ id: 12, name: 'Giao tiếp A1-01', status: 'FINISHED', currentHeadcount: 10, maxCapacity: 18, scheduleDay: 'MON', startTime: '17:00', endTime: '19:00', room: 'A101' });
const classD = makeClass({ id: 13, name: 'IELTS 7.0-01', status: 'CANCELLED', currentHeadcount: 0, maxCapacity: 25, scheduleDay: 'SAT', startTime: '09:00', endTime: '12:00', room: 'C301' });

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

function classesRouter(list: CourseClass[]) {
  return (url: string): MockResponse => {
    if (url === '/notifications/unread/count') return success(0);
    if (url.startsWith('/classes')) {
      return success(list);
    }
    return failure();
  };
}

function renderTeacherClasses() {
  return render(
    <MemoryRouter initialEntries={['/teacher/classes']}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('TeacherClassesPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders page header with title and description', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(classesRouter([classA, classB])));

    renderTeacherClasses();

    expect(await screen.findByRole('heading', { name: 'Lớp học' })).toBeTruthy();
    expect(await screen.findByText('Danh sách các lớp bạn đang phụ trách.')).toBeTruthy();
  });

  it('calls GET /api/classes?teacherId={id} with correct teacherId', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    const fetchMock = createFetchMock(classesRouter([classA]));
    vi.stubGlobal('fetch', fetchMock);

    renderTeacherClasses();

    await screen.findByText('IELTS 6.0-01');

    const classesCall = fetchMock.mock.calls.find(([input]) =>
      String(input).includes('/classes?teacherId=5'),
    );
    expect(classesCall).toBeTruthy();
  });

  it('renders multiple classes with course, schedule, room, status and enrollment', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(classesRouter([classA, classB])));

    renderTeacherClasses();

    await screen.findByText('IELTS 6.0-01');
    await screen.findByText('IELTS 6.0-02');

    const rowA = screen.getByText('IELTS 6.0-01').closest('tr');
    expect(rowA).not.toBeNull();
    expect(within(rowA as HTMLElement).getByText('IELTS 6.0')).toBeTruthy();
    expect(within(rowA as HTMLElement).getByText('Thứ 3 18:00–20:00')).toBeTruthy();
    expect(within(rowA as HTMLElement).getByText('B201')).toBeTruthy();
    expect(within(rowA as HTMLElement).getByText('Đang học')).toBeTruthy();
    expect(within(rowA as HTMLElement).getByText('12 / 20')).toBeTruthy();

    const rowB = screen.getByText('IELTS 6.0-02').closest('tr');
    expect(rowB).not.toBeNull();
    expect(within(rowB as HTMLElement).getByText('Thứ 5 19:00–21:00')).toBeTruthy();
    expect(within(rowB as HTMLElement).getByText('B202')).toBeTruthy();
    expect(within(rowB as HTMLElement).getByText('Sắp khai giảng')).toBeTruthy();
    expect(within(rowB as HTMLElement).getByText('8 / 15')).toBeTruthy();
  });

  it('displays correct status badges with tones', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(classesRouter([classA, classB, classC, classD])));

    renderTeacherClasses();

    await screen.findByText('IELTS 6.0-01');
    expect(screen.getByText('Đang học').closest('span')?.className).toContain('primary');
    expect(screen.getByText('Sắp khai giảng').closest('span')?.className).toContain('warning');
    expect(screen.getByText('Đã kết thúc').closest('span')?.className).toContain('success');
    expect(screen.getByText('Đã hủy').closest('span')?.className).toContain('danger');
  });

  it('filters classes by status client-side', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(classesRouter([classA, classB, classC, classD])));

    renderTeacherClasses();

    await screen.findByText('IELTS 6.0-01');

    fireEvent.change(screen.getByLabelText('Lọc trạng thái'), { target: { value: 'STUDYING' } });
    await waitFor(() => {
      expect(screen.queryByText('IELTS 6.0-02')).toBeNull();
      expect(screen.queryByText('Giao tiếp A1-01')).toBeNull();
      expect(screen.queryByText('IELTS 7.0-01')).toBeNull();
    });
    expect(screen.getByText('IELTS 6.0-01')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Lọc trạng thái'), { target: { value: 'ALL' } });
    await waitFor(() => {
      expect(screen.getByText('IELTS 6.0-01')).toBeTruthy();
      expect(screen.getByText('IELTS 6.0-02')).toBeTruthy();
      expect(screen.getByText('Giao tiếp A1-01')).toBeTruthy();
      expect(screen.getByText('IELTS 7.0-01')).toBeTruthy();
    });
  });

  it('shows empty state when teacher has no classes', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(classesRouter([])));

    renderTeacherClasses();

    expect(await screen.findByText('Chưa được phân công lớp nào')).toBeTruthy();
    expect(screen.getByText('Bạn chưa được phân công dạy lớp nào. Vui lòng liên hệ quản trị viên.')).toBeTruthy();
  });

  it('shows error state and refetches when retrying', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ success: false, message: 'Internal server error' }),
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    renderTeacherClasses();

    expect(await screen.findByText('Không thể tải danh sách lớp học')).toBeTruthy();

    vi.stubGlobal('fetch', createFetchMock(classesRouter([classA])));
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('IELTS 6.0-01')).toBeTruthy();
  });

  it('shows loading skeleton while fetching', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    let resolveFetch: (value: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input).replace('/api', '');
      if (url === '/notifications/unread/count') {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ success: true, data: 0, message: 'OK' }) });
      }
      if (url.startsWith('/classes')) {
        return fetchPromise;
      }
      return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({ success: false, message: 'Internal server error' }) });
    });
    vi.stubGlobal('fetch', fetchMock);

    renderTeacherClasses();

    expect(screen.getByRole('status', { name: 'Đang tải danh sách lớp học' })).toBeTruthy();
    expect(screen.getAllByTestId('skeleton-row').length).toBeGreaterThanOrEqual(4);

    resolveFetch!({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data: [classA], message: 'OK' }),
    });
    await fetchPromise;

    await screen.findByText('IELTS 6.0-01');
    expect(screen.queryByRole('status', { name: 'Đang tải danh sách lớp học' })).toBeNull();
  });

  it('renders TeacherClassesPage for /teacher/classes instead of PlaceholderPage', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(classesRouter([classA])));

    renderTeacherClasses();

    expect(await screen.findByRole('heading', { name: 'Lớp học' })).toBeTruthy();
    expect(await screen.findByText('Danh sách các lớp bạn đang phụ trách.')).toBeTruthy();
    expect(screen.queryByText('Chức năng sẽ được triển khai ở các bước tiếp theo.')).toBeNull();
    expect(screen.queryByText('Lớp học chưa sẵn sàng')).toBeNull();
  });

  it('shows error when session user has no id', async () => {
    const userWithoutId: User = { ...teacherUser, id: 0 };
    authStorage.setSession('jwt.teacher', userWithoutId);
    vi.stubGlobal('fetch', createFetchMock(classesRouter([])));

    renderTeacherClasses();

    expect(await screen.findByText('Không xác định được giáo viên. Vui lòng đăng nhập lại.')).toBeTruthy();
  });
});