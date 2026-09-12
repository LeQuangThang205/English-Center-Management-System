import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AppRoutes } from '@/routes/AppRoutes';
import { authStorage } from '@/features/auth/authStorage';
import type { Registration } from '@/types/registration';
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

function makeRegistration(
  overrides: Partial<Registration> & { id: number; status: Registration['status'] },
): Registration {
  return {
    studentId: 10,
    studentName: 'Nguyễn Văn An',
    classId: 3,
    className: 'Beginner Class B',
    courseName: 'English Foundation',
    tuitionAtRegistration: 1500000,
    registeredAt: '2026-08-20T10:00:00',
    ...overrides,
  };
}

const approvedRegistration = makeRegistration({ id: 1, status: 'APPROVED' });
const paidRegistration = makeRegistration({
  id: 2,
  status: 'PAID',
  classId: 4,
  className: 'Intermediate Class A',
  courseName: 'English Communication',
  tuitionAtRegistration: 1800000,
  registeredAt: '2026-08-21T10:00:00',
});
const pendingRegistration = makeRegistration({ id: 3, status: 'PENDING' });
const rejectedRegistration = makeRegistration({ id: 4, status: 'REJECTED' });
const cancelledRegistration = makeRegistration({ id: 5, status: 'CANCELLED' });

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

function registrationsRouter(list: Registration[]) {
  return (url: string): MockResponse => {
    if (url === '/notifications/unread/count') return success(0);
    if (url.startsWith('/registrations')) {
      return success(list);
    }
    return failure();
  };
}

function renderStudentCourses() {
  return render(
    <MemoryRouter initialEntries={['/student/courses']}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('StudentCoursesPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders page header with title and description', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(registrationsRouter([approvedRegistration, paidRegistration])),
    );

    renderStudentCourses();

    expect(await screen.findByRole('heading', { name: 'Khóa học của tôi' })).toBeTruthy();
    expect(
      await screen.findByText('Các lớp bạn đã được duyệt và đang theo học.'),
    ).toBeTruthy();
  });

  it('calls GET /api/registrations with own studentId', async () => {
    authStorage.setSession('jwt.student', studentUser);
    const fetchMock = createFetchMock(registrationsRouter([approvedRegistration]));
    vi.stubGlobal('fetch', fetchMock);

    renderStudentCourses();

    await screen.findByText('Beginner Class B');

    const registrationsCall = fetchMock.mock.calls.find(([input]) =>
      String(input).includes('/registrations'),
    );
    expect(registrationsCall).toBeTruthy();
    const [url] = registrationsCall!;
    expect(String(url)).toContain('/registrations?studentId=10');
  });

  it('does not call registrations API when session user has no id', async () => {
    const userWithoutId: User = { ...studentUser, id: 0 };
    authStorage.setSession('jwt.student', userWithoutId);
    const fetchMock = createFetchMock(registrationsRouter([]));
    vi.stubGlobal('fetch', fetchMock);

    renderStudentCourses();

    expect(
      await screen.findByText('Không xác định được học viên. Vui lòng đăng nhập lại.'),
    ).toBeTruthy();
    expect(
      fetchMock.mock.calls.some(([input]) => String(input).includes('/registrations')),
    ).toBe(false);
  });

  it('shows only APPROVED and PAID registrations', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(
        registrationsRouter([
          approvedRegistration,
          paidRegistration,
          pendingRegistration,
          rejectedRegistration,
          cancelledRegistration,
        ]),
      ),
    );

    renderStudentCourses();

    await screen.findByText('Beginner Class B');
    await screen.findByText('Intermediate Class A');

    const table = screen.getByRole('table');
    // header row + exactly 2 data rows (PENDING/REJECTED/CANCELLED filtered out)
    expect(within(table).getAllByRole('row')).toHaveLength(3);
  });

  it('does not render PENDING or REJECTED rows', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(
        registrationsRouter([pendingRegistration, rejectedRegistration, cancelledRegistration]),
      ),
    );

    renderStudentCourses();

    expect(await screen.findByText('Chưa có khóa học nào')).toBeTruthy();
    expect(screen.queryByText('Đã duyệt')).toBeNull();
    expect(screen.queryByText('Đã thanh toán')).toBeNull();
  });

  it('renders APPROVED badge and PAID badge correctly', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(registrationsRouter([approvedRegistration, paidRegistration])),
    );

    renderStudentCourses();

    await screen.findByText('Beginner Class B');

    const rowApproved = screen.getByText('Beginner Class B').closest('tr');
    expect(rowApproved).not.toBeNull();
    expect(within(rowApproved as HTMLElement).getByText('Đã duyệt')).toBeTruthy();

    const rowPaid = screen.getByText('Intermediate Class A').closest('tr');
    expect(rowPaid).not.toBeNull();
    expect(within(rowPaid as HTMLElement).getByText('Đã thanh toán')).toBeTruthy();
  });

  it('formats tuition with VND and registration date', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(registrationsRouter([approvedRegistration, paidRegistration])),
    );

    renderStudentCourses();

    await screen.findByText('Beginner Class B');
    expect(screen.getByText('1.500.000 ₫')).toBeTruthy();
    expect(screen.getByText('1.800.000 ₫')).toBeTruthy();
    expect(screen.getByText('20/08/2026')).toBeTruthy();
    expect(screen.getByText('21/08/2026')).toBeTruthy();
  });

  it('shows empty state when student has no APPROVED or PAID courses', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(registrationsRouter([])));

    renderStudentCourses();

    expect(await screen.findByText('Chưa có khóa học nào')).toBeTruthy();
    expect(screen.getByText(/sang trang Đăng ký/)).toBeTruthy();
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

    renderStudentCourses();

    expect(await screen.findByText('Không thể tải danh sách khóa học')).toBeTruthy();

    vi.stubGlobal('fetch', createFetchMock(registrationsRouter([approvedRegistration])));
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Beginner Class B')).toBeTruthy();
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
      if (url.startsWith('/registrations')) {
        return fetchPromise;
      }
      return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({ success: false, message: 'Internal server error' }) });
    });
    vi.stubGlobal('fetch', fetchMock);

    renderStudentCourses();

    expect(screen.getByRole('status', { name: 'Đang tải danh sách khóa học' })).toBeTruthy();
    expect(screen.getAllByTestId('skeleton-row').length).toBeGreaterThanOrEqual(4);

    resolveFetch!({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data: [approvedRegistration], message: 'OK' }),
    });
    await fetchPromise;

    await screen.findByText('Beginner Class B');
    expect(screen.queryByRole('status', { name: 'Đang tải danh sách khóa học' })).toBeNull();
  });

  it('renders StudentCoursesPage for /student/courses instead of PlaceholderPage', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(registrationsRouter([approvedRegistration])));

    renderStudentCourses();

    expect(await screen.findByRole('heading', { name: 'Khóa học của tôi' })).toBeTruthy();
    expect(screen.queryByText('Chức năng sẽ được triển khai ở các bước tiếp theo.')).toBeNull();
  });
});
