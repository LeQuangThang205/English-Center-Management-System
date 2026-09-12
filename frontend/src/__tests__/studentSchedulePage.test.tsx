import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AppRoutes } from '@/routes/AppRoutes';
import { authStorage } from '@/features/auth/authStorage';
import type { Schedule } from '@/types/schedule';
import type { User } from '@/types/user';

const baseUser: Omit<User, 'role' | 'email' | 'fullName'> = {
  id: 10,
  phone: null,
  status: 'ACTIVE',
  avatarUrl: null,
  emailVerifiedAt: null,
  lastLoginAt: null,
  createdAt: null,
  updatedAt: null,
};

const studentUser: User = {
  ...baseUser,
  role: 'STUDENT',
  email: 'student1@example.com',
  fullName: 'Nguyễn Văn An',
};

function makeSchedule(overrides: Partial<Schedule> & { classId: number }): Schedule {
  return {
    className: `Lớp ${overrides.classId}`,
    courseName: 'IELTS 6.0',
    scheduleDay: 'TUE',
    startTime: '18:00:00',
    endTime: '20:00:00',
    room: 'B201',
    teacherId: 5,
    teacherName: 'Trần Văn Bình',
    startDate: '2026-09-01T00:00:00',
    endDate: '2026-12-15T00:00:00',
    ...overrides,
  };
}

const scheduleA = makeSchedule({
  classId: 10,
  className: 'IELTS 6.0-01',
  scheduleDay: 'TUE',
  startTime: '18:00:00',
  endTime: '20:00:00',
  room: 'B201',
});
const scheduleB = makeSchedule({
  classId: 11,
  className: 'IELTS 6.0-02',
  scheduleDay: 'THU',
  startTime: '19:00:00',
  endTime: '21:00:00',
  room: 'B202',
});
const scheduleC = makeSchedule({
  classId: 12,
  className: 'Giao tiếp A1-01',
  scheduleDay: 'MON',
  startTime: '17:00:00',
  endTime: '19:00:00',
  room: 'A101',
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

function schedulesRouter(list: Schedule[]) {
  return (url: string): MockResponse => {
    if (url === '/notifications/unread/count') return success(0);
    if (url.startsWith('/schedules')) {
      return success(list);
    }
    return failure();
  };
}

function renderStudentSchedule() {
  return render(
    <MemoryRouter initialEntries={['/student/schedule']}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('StudentSchedulePage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders page header with title and description', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(schedulesRouter([scheduleA, scheduleB])));

    renderStudentSchedule();

    expect(await screen.findByRole('heading', { name: 'Lịch học' })).toBeTruthy();
    expect(await screen.findByText('Lịch học của bạn trong khoảng thời gian đã chọn.')).toBeTruthy();
  });

  it('calls GET /api/schedules with from and to params and no teacherId', async () => {
    authStorage.setSession('jwt.student', studentUser);
    const fetchMock = createFetchMock(schedulesRouter([scheduleA]));
    vi.stubGlobal('fetch', fetchMock);

    renderStudentSchedule();

    await screen.findByText('IELTS 6.0-01');

    const schedulesCall = fetchMock.mock.calls.find(([input]) =>
      String(input).includes('/schedules'),
    );
    expect(schedulesCall).toBeTruthy();
    const [url] = schedulesCall!;
    expect(String(url)).toContain('/schedules?from=');
    expect(String(url)).toContain('&to=');
    expect(String(url)).not.toContain('teacherId');
  });

  it('renders multiple schedules with class, course, schedule, room, date range and teacher', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(schedulesRouter([scheduleA, scheduleB])));

    renderStudentSchedule();

    await screen.findByText('IELTS 6.0-01');
    await screen.findByText('IELTS 6.0-02');

    const rowA = screen.getByText('IELTS 6.0-01').closest('tr');
    expect(rowA).not.toBeNull();
    expect(within(rowA as HTMLElement).getByText('IELTS 6.0')).toBeTruthy();
    expect(within(rowA as HTMLElement).getByText('Thứ 3 18:00–20:00')).toBeTruthy();
    expect(within(rowA as HTMLElement).getByText('B201')).toBeTruthy();
    expect(within(rowA as HTMLElement).getByText('00:00 01/09/2026 – 00:00 15/12/2026')).toBeTruthy();
    expect(within(rowA as HTMLElement).getByText('Trần Văn Bình')).toBeTruthy();

    const rowB = screen.getByText('IELTS 6.0-02').closest('tr');
    expect(rowB).not.toBeNull();
    expect(within(rowB as HTMLElement).getByText('Thứ 5 19:00–21:00')).toBeTruthy();
    expect(within(rowB as HTMLElement).getByText('B202')).toBeTruthy();
  });

  it('displays correct schedule day labels', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(schedulesRouter([scheduleA, scheduleB, scheduleC])));

    renderStudentSchedule();

    await screen.findByText('IELTS 6.0-01');
    expect(screen.getByText('Thứ 3 18:00–20:00')).toBeTruthy();
    expect(screen.getByText('Thứ 5 19:00–21:00')).toBeTruthy();
    expect(screen.getByText('Thứ 2 17:00–19:00')).toBeTruthy();
  });

  it('filters schedules by changing from/to dates', async () => {
    authStorage.setSession('jwt.student', studentUser);
    const fetchMock = createFetchMock(schedulesRouter([scheduleA, scheduleB]));
    vi.stubGlobal('fetch', fetchMock);

    renderStudentSchedule();

    await screen.findByText('IELTS 6.0-01');

    const fromInput = screen.getByLabelText('Từ ngày') as HTMLInputElement;
    const toInput = screen.getByLabelText('Đến ngày') as HTMLInputElement;

    fireEvent.change(fromInput, { target: { value: '2026-10-01' } });
    fireEvent.change(toInput, { target: { value: '2026-10-31' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lọc' }));

    await waitFor(() => {
      const lastCall = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
      const [url] = lastCall;
      expect(String(url)).toContain('from=2026-10-01');
      expect(String(url)).toContain('to=2026-10-31');
    });
  });

  it('shows empty state when student has no schedules in range', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(schedulesRouter([])));

    renderStudentSchedule();

    expect(await screen.findByText('Chưa có lịch học')).toBeTruthy();
    expect(screen.getByText('Không có lịch học nào trong khoảng thời gian này.')).toBeTruthy();
  });

  it('shows error state and refetches when retrying', async () => {
    authStorage.setSession('jwt.student', studentUser);
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ success: false, message: 'Internal server error' }),
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    renderStudentSchedule();

    expect(await screen.findByText('Không thể tải lịch học')).toBeTruthy();

    vi.stubGlobal('fetch', createFetchMock(schedulesRouter([scheduleA])));
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('IELTS 6.0-01')).toBeTruthy();
  });

  it('shows loading skeleton while fetching', async () => {
    authStorage.setSession('jwt.student', studentUser);
    let resolveFetch: (value: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input).replace('/api', '');
      if (url === '/notifications/unread/count') {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ success: true, data: 0, message: 'OK' }) });
      }
      if (url.startsWith('/schedules')) {
        return fetchPromise;
      }
      return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({ success: false, message: 'Internal server error' }) });
    });
    vi.stubGlobal('fetch', fetchMock);

    renderStudentSchedule();

    expect(screen.getByRole('status', { name: 'Đang tải lịch học' })).toBeTruthy();
    expect(screen.getAllByTestId('skeleton-row').length).toBeGreaterThanOrEqual(4);

    resolveFetch!({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data: [scheduleA], message: 'OK' }),
    });
    await fetchPromise;

    await screen.findByText('IELTS 6.0-01');
    expect(screen.queryByRole('status', { name: 'Đang tải lịch học' })).toBeNull();
  });

  it('renders StudentSchedulePage for /student/schedule instead of PlaceholderPage', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(schedulesRouter([scheduleA])));

    renderStudentSchedule();

    expect(await screen.findByRole('heading', { name: 'Lịch học' })).toBeTruthy();
    expect(screen.queryByText('Chức năng sẽ được triển khai ở các bước tiếp theo.')).toBeNull();
    expect(screen.queryByText('Lịch học chưa sẵn sàng')).toBeNull();
  });

  it('shows error when session user has no id', async () => {
    const userWithoutId: User = { ...studentUser, id: 0 };
    authStorage.setSession('jwt.student', userWithoutId);
    vi.stubGlobal('fetch', createFetchMock(schedulesRouter([])));

    renderStudentSchedule();

    expect(await screen.findByText('Không xác định được học viên. Vui lòng đăng nhập lại.')).toBeTruthy();
  });
});
