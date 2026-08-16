import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { useAuth } from '@/features/auth/useAuth';
import { AppRoutes } from '@/routes/AppRoutes';
import { authStorage } from '@/features/auth/authStorage';
import { http } from '@/services/api/httpClient';
import type { Role, User } from '@/types/user';

interface MockResponse {
  status?: number;
  body: unknown;
}

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

function makeUser(role: Role, email: string): User {
  return { ...baseUser, role, email, fullName: role.toLowerCase() };
}

function mockFetchOnce({ status = 200, body }: MockResponse) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    }),
  );
}

function mockRawFetchOnce({ status }: { status: number }) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.reject(new SyntaxError('Unexpected end of JSON input')),
    }),
  );
}

function mockFetchWithRoutes(
  routes: Array<{ match: (url: string) => boolean; response: MockResponse }>,
) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      const route = routes.find((item) => item.match(url));
      if (!route) {
        return Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ success: false, message: 'Not found' }),
        });
      }
      const { status = 200, body } = route.response;
      return Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(body),
      });
    }),
  );
}

function mockDashboardRoutes(loginBody: unknown) {
  const emptyList = { success: true, data: [] };
  mockFetchWithRoutes([
    { match: (url) => url.includes('/auth/login'), response: { body: loginBody } },
    { match: (url) => url.includes('/users'), response: { body: emptyList } },
    { match: (url) => url.includes('/courses'), response: { body: emptyList } },
    { match: (url) => url.includes('/classes'), response: { body: emptyList } },
    { match: (url) => url.includes('/registrations'), response: { body: emptyList } },
    { match: (url) => url.includes('/transactions'), response: { body: emptyList } },
    { match: (url) => url.includes('/schedules'), response: { body: emptyList } },
    {
      match: (url) => url.includes('/notifications/unread/count'),
      response: { body: { success: true, data: 0 } },
    },
  ]);
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

function submitLogin(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
}

function SessionProbe() {
  const { user } = useAuth();
  return <div data-testid="session">{user ? user.email : 'anonymous'}</div>;
}

describe('authentication', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('logs in an ADMIN and redirects to the admin dashboard', async () => {
    const user = makeUser('ADMIN', 'admin@example.com');
    mockDashboardRoutes({
      success: true,
      data: { token: 'jwt.admin', user },
      message: 'Login successful',
    });

    renderAt('/login');
    submitLogin('admin@example.com', 'password123');

    expect(await screen.findByText('Học viên đang hoạt động')).toBeTruthy();
    expect(screen.getByText('Tổng quan hoạt động của trung tâm.')).toBeTruthy();
    expect(authStorage.getToken()).toBe('jwt.admin');
    expect(authStorage.getUser()?.email).toBe('admin@example.com');
  });

  it('logs in a TEACHER and redirects to the teacher dashboard', async () => {
    const user = makeUser('TEACHER', 'teacher1@example.com');
    mockDashboardRoutes({
      success: true,
      data: { token: 'jwt.teacher', user },
      message: 'Login successful',
    });

    renderAt('/login');
    submitLogin('teacher1@example.com', 'password123');

    expect(await screen.findByText('Lớp đang dạy')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Lớp của tôi' })).toBeTruthy();
  });

  it('logs in a STUDENT and redirects to the student dashboard', async () => {
    const user = makeUser('STUDENT', 'student1@example.com');
    mockDashboardRoutes({
      success: true,
      data: { token: 'jwt.student', user },
      message: 'Login successful',
    });

    renderAt('/login');
    submitLogin('student1@example.com', 'password123');

    expect(await screen.findByText('Thông báo chưa đọc')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Khóa học của tôi' })).toBeTruthy();
  });

  it('shows a friendly error and stays on login when credentials are wrong', async () => {
    mockFetchOnce({
      status: 401,
      body: { success: false, message: 'Invalid email or password' },
    });

    renderAt('/login');
    submitLogin('admin@example.com', 'wrong-password');

    expect(await screen.findByText('Email hoặc mật khẩu không đúng.')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeTruthy();
    expect(authStorage.getToken()).toBeNull();
    const button = screen.getByRole('button', { name: 'Đăng nhập' });
    expect(button.hasAttribute('disabled')).toBe(false);
  });

  it('shows a connection error when the backend is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    renderAt('/login');
    submitLogin('admin@example.com', 'password123');

    expect(
      await screen.findByText('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.'),
    ).toBeTruthy();
  });

  it('validates required fields without calling the API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    renderAt('/login');
    submitLogin('', '');

    expect(screen.getByText('Vui lòng nhập email.')).toBeTruthy();
    expect(screen.getByText('Vui lòng nhập mật khẩu.')).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid email format without calling the API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    renderAt('/login');
    submitLogin('not-an-email', 'password123');

    expect(screen.getByText('Email không hợp lệ.')).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('clears the session when a protected request returns 401', async () => {
    const user = makeUser('ADMIN', 'admin@example.com');
    authStorage.setSession('jwt.admin', user);

    render(
      <MemoryRouter>
        <AuthProvider>
          <SessionProbe />
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('session').textContent).toBe('admin@example.com');

    mockFetchOnce({ status: 401, body: { success: false, message: 'Unauthorized' } });
    await expect(http.get('/users')).rejects.toMatchObject({ status: 401 });

    await waitFor(() => {
      expect(screen.getByTestId('session').textContent).toBe('anonymous');
    });
    expect(authStorage.getToken()).toBeNull();
    expect(authStorage.getUser()).toBeNull();
  });

  it('clears the session when a protected request returns 403 with an empty body (expired token)', async () => {
    const user = makeUser('ADMIN', 'admin@example.com');
    authStorage.setSession('jwt.expired', user);

    render(
      <MemoryRouter>
        <AuthProvider>
          <SessionProbe />
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('session').textContent).toBe('admin@example.com');

    mockRawFetchOnce({ status: 403 });
    await expect(http.get('/users')).rejects.toMatchObject({ status: 403 });

    await waitFor(() => {
      expect(screen.getByTestId('session').textContent).toBe('anonymous');
    });
    expect(authStorage.getToken()).toBeNull();
  });

  it('keeps the session on 403 Access denied (authenticated but forbidden)', async () => {
    const user = makeUser('TEACHER', 'teacher1@example.com');
    authStorage.setSession('jwt.teacher', user);

    render(
      <MemoryRouter>
        <AuthProvider>
          <SessionProbe />
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('session').textContent).toBe('teacher1@example.com');

    mockFetchOnce({ status: 403, body: { success: false, message: 'Access denied' } });
    await expect(http.get('/admin/students')).rejects.toMatchObject({ status: 403 });

    expect(screen.getByTestId('session').textContent).toBe('teacher1@example.com');
    expect(authStorage.getToken()).toBe('jwt.teacher');
  });

  it('redirects an already authenticated user away from the login page', async () => {
    const user = makeUser('STUDENT', 'student1@example.com');
    authStorage.setSession('jwt.student', user);
    mockDashboardRoutes(null);

    renderAt('/login');

    expect(await screen.findByText('Tổng quan khóa học và lịch học của bạn.')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Đăng nhập' })).toBeNull();
  });
});