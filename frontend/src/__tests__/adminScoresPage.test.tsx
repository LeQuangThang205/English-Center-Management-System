import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AppRoutes } from '@/routes/AppRoutes';
import { authStorage } from '@/features/auth/authStorage';
import type { CourseClass } from '@/types/courseClass';
import type { Score } from '@/types/score';
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

function makeScore(overrides: Partial<Score> & { id: number }): Score {
  return {
    studentId: 10,
    studentName: 'Nguyễn Văn An',
    classId: 3,
    className: 'Beginner Class B',
    courseName: 'English Foundation',
    midtermScore: 7.5,
    finalScore: 8.0,
    totalScore: 7.8,
    comment: 'Tiến bộ tốt',
    createdById: 5,
    createdByName: 'Trần Văn Bình',
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

const passedScore = makeScore({ id: 1 });
const failedScore = makeScore({
  id: 2,
  studentId: 11,
  studentName: 'Trần Thị Bình',
  midtermScore: 3.0,
  finalScore: 4.0,
  totalScore: 3.6,
  comment: 'Cần cố gắng thêm',
});
const unscoredScore = makeScore({
  id: 3,
  studentId: 12,
  studentName: 'Lê Văn Cường',
  classId: 4,
  className: 'Intermediate Class A',
  courseName: 'English Communication',
  midtermScore: null,
  finalScore: null,
  totalScore: null,
  comment: null,
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

function adminScoresRouter(classes: CourseClass[], scores: Score[]) {
  return (url: string): MockResponse => {
    if (url === '/notifications/unread/count') return success(0);
    if (url === '/classes' || url.startsWith('/classes?')) return success(classes);
    if (url === '/scores' || url.startsWith('/scores?')) return success(scores);
    return failure();
  };
}

function renderAdminScores() {
  return render(
    <MemoryRouter initialEntries={['/admin/scores']}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('AdminScoresPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders page header with title and description', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(adminScoresRouter([classA, classB], [passedScore])),
    );

    renderAdminScores();

    expect(await screen.findByRole('heading', { name: 'Bảng điểm' })).toBeTruthy();
    expect(
      await screen.findByText('Xem điểm số của học viên trên toàn hệ thống.'),
    ).toBeTruthy();
  });

  it('loads classes and requests all scores by default', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    const fetchMock = createFetchMock(adminScoresRouter([classA, classB], [passedScore]));
    vi.stubGlobal('fetch', fetchMock);

    renderAdminScores();

    await screen.findByText('Nguyễn Văn An');

    const scoresCall = fetchMock.mock.calls.find(
      ([input]) => String(input).split('?')[0].endsWith('/scores'),
    );
    expect(scoresCall).toBeTruthy();
    // default "all classes" must not send classId
    expect(String(scoresCall![0])).not.toContain('classId');

    const classesCall = fetchMock.mock.calls.find(([input]) =>
      String(input).includes('/classes'),
    );
    expect(classesCall).toBeTruthy();
  });

  it('refetches scores server-side when changing class filter', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    const fetchMock = createFetchMock(adminScoresRouter([classA, classB], [passedScore]));
    vi.stubGlobal('fetch', fetchMock);

    renderAdminScores();

    await screen.findByText('Nguyễn Văn An');

    fireEvent.change(screen.getByLabelText('Lọc theo lớp học'), {
      target: { value: '3' },
    });

    await waitFor(() => {
      const filtered = fetchMock.mock.calls.filter(([input]) =>
        String(input).includes('/scores?classId=3'),
      );
      expect(filtered.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders student, class, course and score columns', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(adminScoresRouter([classA], [passedScore, failedScore])),
    );

    renderAdminScores();

    await screen.findByText('Nguyễn Văn An');
    await screen.findByText('Trần Thị Bình');

    const row = screen.getByText('Nguyễn Văn An').closest('tr');
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByText('Beginner Class B')).toBeTruthy();
    expect(within(row as HTMLElement).getByText('English Foundation')).toBeTruthy();
    expect(within(row as HTMLElement).getByText('7.5')).toBeTruthy();
    expect(within(row as HTMLElement).getByText('8.0')).toBeTruthy();
    expect(within(row as HTMLElement).getByText('7.8')).toBeTruthy();
    expect(within(row as HTMLElement).getByText('Tiến bộ tốt')).toBeTruthy();
  });

  it('renders Đạt badge for totalScore >= 5.0', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(adminScoresRouter([classA], [passedScore])));

    renderAdminScores();

    await screen.findByText('Nguyễn Văn An');
    const row = screen.getByText('Nguyễn Văn An').closest('tr');
    expect(within(row as HTMLElement).getByText('Đạt')).toBeTruthy();
  });

  it('renders Không đạt badge for totalScore < 5.0', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(adminScoresRouter([classA], [failedScore])));

    renderAdminScores();

    await screen.findByText('Trần Thị Bình');
    const row = screen.getByText('Trần Thị Bình').closest('tr');
    expect(within(row as HTMLElement).getByText('Không đạt')).toBeTruthy();
  });

  it('renders dash for null totalScore and null comment', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(adminScoresRouter([classB], [unscoredScore])));

    renderAdminScores();

    await screen.findByText('Lê Văn Cường');
    const row = screen.getByText('Lê Văn Cường').closest('tr');
    expect(row).not.toBeNull();
    const dashes = within(row as HTMLElement).getAllByText('—');
    // total + result + comment cells
    expect(dashes.length).toBeGreaterThanOrEqual(3);
    expect(within(row as HTMLElement).queryByText('Đạt')).toBeNull();
    expect(within(row as HTMLElement).queryByText('Không đạt')).toBeNull();
  });

  it('still renders scores when classes list is empty', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(adminScoresRouter([], [passedScore])));

    renderAdminScores();

    expect(await screen.findByText('Nguyễn Văn An')).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Tất cả các lớp' })).toBeTruthy();
  });

  it('shows system-wide empty state when there are no scores', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(adminScoresRouter([classA], [])));

    renderAdminScores();

    expect(await screen.findByText('Chưa có điểm số')).toBeTruthy();
  });

  it('shows class-scoped empty state when filtered class has no scores', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(adminScoresRouter([classA, classB], [])));

    renderAdminScores();

    await screen.findByText('Chưa có điểm số');

    // switch to a class filter still yields the class-scoped message on refetch
    const fetchMock = createFetchMock(adminScoresRouter([classA, classB], []));
    vi.stubGlobal('fetch', fetchMock);
    fireEvent.change(screen.getByLabelText('Lọc theo lớp học'), {
      target: { value: '3' },
    });

    expect(await screen.findByText('Lớp này chưa có điểm số')).toBeTruthy();
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

    renderAdminScores();

    expect(await screen.findByText('Không thể tải bảng điểm')).toBeTruthy();

    vi.stubGlobal('fetch', createFetchMock(adminScoresRouter([classA], [passedScore])));
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Nguyễn Văn An')).toBeTruthy();
  });

  it('shows loading skeleton while fetching', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    let resolveClasses: (value: unknown) => void;
    let resolveScores: (value: unknown) => void;
    const classesPromise = new Promise((resolve) => {
      resolveClasses = resolve;
    });
    const scoresPromise = new Promise((resolve) => {
      resolveScores = resolve;
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
      if (url.startsWith('/scores')) {
        return scoresPromise;
      }
      return Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ success: false, message: 'Internal server error' }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    renderAdminScores();

    expect(screen.getByRole('status', { name: 'Đang tải bảng điểm' })).toBeTruthy();
    expect(screen.getAllByTestId('skeleton-row').length).toBeGreaterThanOrEqual(4);

    resolveClasses!(ok([classA]));
    resolveScores!(ok([passedScore]));
    await Promise.all([classesPromise, scoresPromise]);

    await screen.findByText('Nguyễn Văn An');
    expect(screen.queryByRole('status', { name: 'Đang tải bảng điểm' })).toBeNull();
  });

  it('renders AdminScoresPage for /admin/scores instead of PlaceholderPage', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(adminScoresRouter([classA], [passedScore])));

    renderAdminScores();

    expect(await screen.findByRole('heading', { name: 'Bảng điểm' })).toBeTruthy();
    expect(screen.queryByText('Chức năng sẽ được triển khai ở các bước tiếp theo.')).toBeNull();
  });

  it('does not render score edit controls', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(adminScoresRouter([classA], [passedScore])));

    renderAdminScores();

    await screen.findByText('Nguyễn Văn An');
    expect(screen.queryByRole('button', { name: 'Nhập' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Lưu' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Xóa' })).toBeNull();
  });
});
