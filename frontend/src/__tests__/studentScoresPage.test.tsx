import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AppRoutes } from '@/routes/AppRoutes';
import { authStorage } from '@/features/auth/authStorage';
import { formatScore } from '@/utils/format';
import type { Score } from '@/types/score';
import type { User } from '@/types/user';

/* ───────── helpers ───────── */

const studentUser: User = {
  id: 10,
  role: 'STUDENT',
  email: 'student1@example.com',
  fullName: 'Nguyễn An',
  phone: null,
  status: 'ACTIVE',
  avatarUrl: null,
  emailVerifiedAt: null,
  lastLoginAt: null,
  createdAt: null,
  updatedAt: null,
};

/* ───────── seed data ───────── */

const scoreA: Score = {
  id: 100,
  studentId: 10,
  studentName: 'Nguyễn An',
  classId: 1,
  className: 'Intermediate A',
  courseName: 'IELTS 6.0',
  midtermScore: 8.0,
  finalScore: 7.0,
  totalScore: 7.4,
  comment: 'Good',
  createdById: 2,
  createdByName: 'Cô Hà',
  createdAt: null,
  updatedAt: null,
};

const scoreB: Score = {
  id: 101,
  studentId: 10,
  studentName: 'Nguyễn An',
  classId: 2,
  className: 'Beginner B',
  courseName: 'English Foundation',
  midtermScore: 3.0,
  finalScore: 4.0,
  totalScore: 3.6,
  comment: null,
  createdById: 3,
  createdByName: 'Thầy Nam',
  createdAt: null,
  updatedAt: null,
};

const scoreC: Score = {
  id: 102,
  studentId: 10,
  studentName: 'Nguyễn An',
  classId: 3,
  className: 'Advanced A',
  courseName: 'IELTS 7.0+',
  midtermScore: null,
  finalScore: null,
  totalScore: null,
  comment: null,
  createdById: 2,
  createdByName: 'Cô Hà',
  createdAt: null,
  updatedAt: null,
};

/* ───────── unit tests: formatScore ───────── */

describe('formatScore (UC-19)', () => {
  it('formats a number with one decimal place', () => {
    expect(formatScore(8)).toBe('8.0');
    expect(formatScore(7.4)).toBe('7.4');
    expect(formatScore(0)).toBe('0.0');
    expect(formatScore(10)).toBe('10.0');
  });

  it('returns "—" for null or undefined', () => {
    expect(formatScore(null)).toBe('—');
    expect(formatScore(undefined)).toBe('—');
  });
});

/* ───────── mock fetch helpers ───────── */

interface MockResponse {
  ok: boolean;
  status: number;
  body: unknown;
}

type Handler = (url: string, method: string, body: unknown) => MockResponse | undefined;

function createFetchMock(handler: Handler) {
  return vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input).replace('/api', '');
    const method = init?.method ?? 'GET';
    let requestBody: unknown;
    if (typeof init?.body === 'string') {
      try {
        requestBody = JSON.parse(init.body);
      } catch {
        requestBody = init.body;
      }
    }
    const result = handler(url, method, requestBody);
    if (!result) {
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ success: false, message: 'Not found' }),
      });
    }
    return Promise.resolve({
      ok: result.ok,
      status: result.status,
      json: () => Promise.resolve(result.body),
    });
  });
}

const success = (data: unknown): MockResponse => ({
  ok: true,
  status: 200,
  body: { success: true, data, message: 'OK' },
});

/* ───────── student scores router ───────── */

function studentScoresRouter(scores: Score[]): Handler {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (url, _method: string) => {
    if (url === '/notifications/unread/count') return success(0);

    if (url.startsWith('/scores')) {
      const params = new URLSearchParams(url.split('?')[1] ?? '');
      const studentId = Number(params.get('studentId'));
      return success(scores.filter((s) => s.studentId === studentId));
    }

    return undefined;
  };
}

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

/* ───────── integration tests: StudentScoresPage ───────── */

describe('StudentScoresPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders page header with correct title and description', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentScoresRouter([scoreA])));

    renderApp('/student/scores');

    expect(await screen.findByRole('heading', { name: 'Bảng điểm' })).toBeTruthy();
    expect(
      screen.getByText('Xem điểm số và nhận xét các lớp học.'),
    ).toBeTruthy();
  });

  it('loads scores using current student ID', async () => {
    authStorage.setSession('jwt.student', studentUser);
    const fetchMock = createFetchMock(studentScoresRouter([scoreA]));
    vi.stubGlobal('fetch', fetchMock);

    renderApp('/student/scores');
    await screen.findByText('Intermediate A');

    const scoresCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes('/scores?studentId=10'),
    );
    expect(scoresCalls.length).toBe(1);
  });

  it('renders score table with all columns', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentScoresRouter([scoreA])));

    renderApp('/student/scores');
    await screen.findByText('Intermediate A');

    expect(screen.getByText('Khóa học')).toBeTruthy();
    expect(screen.getByText('Giữa kỳ')).toBeTruthy();
    expect(screen.getByText('Cuối kỳ')).toBeTruthy();
    expect(screen.getByText('Tổng kết')).toBeTruthy();
    expect(screen.getByText('Kết quả')).toBeTruthy();
    expect(screen.getByText('Nhận xét')).toBeTruthy();
  });

  it('shows formatted scores with 1 decimal place', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentScoresRouter([scoreA])));

    renderApp('/student/scores');
    await screen.findByText('Intermediate A');

    expect(screen.getByText('8.0')).toBeTruthy();
    expect(screen.getByText('7.0')).toBeTruthy();
    expect(screen.getByText('7.4')).toBeTruthy();
  });

  it('shows "Đạt" badge for totalScore >= 5.0', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentScoresRouter([scoreA])));

    renderApp('/student/scores');
    await screen.findByText('Intermediate A');

    const badges = screen.getAllByText('Đạt');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Không đạt" badge for totalScore < 5.0', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentScoresRouter([scoreB])));

    renderApp('/student/scores');
    await screen.findByText('Beginner B');

    const badges = screen.getAllByText('Không đạt');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "—" for students with null scores', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentScoresRouter([scoreC])));

    renderApp('/student/scores');
    await screen.findByText('Advanced A');

    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  it('shows empty state when student has no scores', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentScoresRouter([])));

    renderApp('/student/scores');

    expect(await screen.findByText('Chưa có điểm số')).toBeTruthy();
    expect(screen.getByText('Giáo viên chưa nhập điểm cho bạn.')).toBeTruthy();
  });

  it('shows error state on API failure', async () => {
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

    renderApp('/student/scores');

    expect(await screen.findByText('Không thể tải bảng điểm')).toBeTruthy();
  });

  it('retries after error state', async () => {
    authStorage.setSession('jwt.student', studentUser);
    let scoresFetched = false;
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input).replace('/api', '');
        if (url === '/notifications/unread/count') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, data: 0, message: 'OK' }),
          });
        }
        if (url.startsWith('/scores') && !scoresFetched) {
          scoresFetched = true;
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ success: false, message: 'Server error' }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true, data: [scoreA], message: 'OK' }),
        });
      }),
    );

    renderApp('/student/scores');
    expect(await screen.findByText('Không thể tải bảng điểm')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Intermediate A')).toBeTruthy();
  });

  it('renders StudentScoresPage for /student/scores instead of PlaceholderPage', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentScoresRouter([scoreA])));

    renderApp('/student/scores');

    expect(await screen.findByRole('heading', { name: 'Bảng điểm' })).toBeTruthy();
    expect(screen.queryByText('Chức năng sẽ được triển khai ở các bước tiếp theo.')).toBeNull();
    expect(screen.queryByText('Tính năng chưa sẵn sàng')).toBeNull();
  });

  it('displays comment text in table', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentScoresRouter([scoreA])));

    renderApp('/student/scores');
    await screen.findByText('Intermediate A');

    expect(screen.getByText('Good')).toBeTruthy();
  });

  it('shows "—" when comment is null', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentScoresRouter([scoreB])));

    renderApp('/student/scores');
    await screen.findByText('Beginner B');

    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('displays multiple scores correctly', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentScoresRouter([scoreA, scoreB, scoreC])));

    renderApp('/student/scores');
    expect(await screen.findByText('Intermediate A')).toBeTruthy();
    expect(screen.getByText('Beginner B')).toBeTruthy();
    expect(screen.getByText('Advanced A')).toBeTruthy();
  });

  it('shows class name and course name correctly', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentScoresRouter([scoreA])));

    renderApp('/student/scores');
    await screen.findByText('Intermediate A');

    expect(screen.getByText('IELTS 6.0')).toBeTruthy();
  });

  it('renders skeleton during loading', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentScoresRouter([])));

    renderApp('/student/scores');

    const skeletons = screen.getAllByRole('status');
    expect(skeletons.length).toBeGreaterThanOrEqual(1);
  });

  it('shows mixed Đạt and Không đạt badges for multiple scores', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentScoresRouter([scoreA, scoreB])));

    renderApp('/student/scores');
    expect(await screen.findByText('Intermediate A')).toBeTruthy();

    expect(screen.getAllByText('Đạt').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Không đạt').length).toBeGreaterThanOrEqual(1);
  });

  it('renders a single score row correctly', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentScoresRouter([scoreA])));

    renderApp('/student/scores');
    await screen.findByText('Intermediate A');

    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(2);
  });

  it('score table has correct column headers', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentScoresRouter([scoreA])));

    renderApp('/student/scores');
    await screen.findByText('Intermediate A');

    expect(screen.getByText('Lớp học')).toBeTruthy();
    expect(screen.getByText('Khóa học')).toBeTruthy();
    expect(screen.getByText('Giữa kỳ')).toBeTruthy();
    expect(screen.getByText('Cuối kỳ')).toBeTruthy();
    expect(screen.getByText('Tổng kết')).toBeTruthy();
    expect(screen.getByText('Kết quả')).toBeTruthy();
    expect(screen.getByText('Nhận xét')).toBeTruthy();
  });

  it('does not show edit or delete buttons (read-only)', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentScoresRouter([scoreA])));

    renderApp('/student/scores');
    await screen.findByText('Intermediate A');

    expect(screen.queryByRole('button', { name: /sửa/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /xóa/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /nhập/i })).toBeNull();
  });
});
