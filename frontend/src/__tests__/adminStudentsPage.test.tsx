import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AppRoutes } from '@/routes/AppRoutes';
import { authStorage } from '@/features/auth/authStorage';
import type { User } from '@/types/user';

const baseUser: Omit<User, 'role' | 'email' | 'fullName'> = {
  id: 1,
  phone: null,
  status: 'ACTIVE',
  avatarUrl: null,
  emailVerifiedAt: null,
  lastLoginAt: null,
  createdAt: '2026-08-01T09:00:00',
  updatedAt: null,
};

const adminUser: User = {
  ...baseUser,
  role: 'ADMIN',
  email: 'admin@example.com',
  fullName: 'Quản Trị Viên',
};

function makeStudent(overrides: Partial<User> & { id: number }): User {
  return {
    ...baseUser,
    role: 'STUDENT',
    email: `student${overrides.id}@example.com`,
    fullName: `Học viên ${overrides.id}`,
    phone: '0903344556',
    ...overrides,
  };
}

const activeStudent = makeStudent({ id: 10 });
const inactiveStudent = makeStudent({ id: 11, status: 'INACTIVE', phone: '0904455667' });

interface MockResponse {
  ok: boolean;
  status: number;
  body: unknown;
}

interface RecordedCall {
  url: string;
  method: string;
  body: unknown;
}

function createFetchMock(
  handler: (url: string, method: string, body: unknown) => MockResponse,
  calls: RecordedCall[],
) {
  return vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input).replace('/api', '');
    const method = init?.method ?? 'GET';
    let body: unknown;
    try {
      body = init?.body ? JSON.parse(String(init.body)) : undefined;
    } catch {
      body = undefined;
    }
    calls.push({ url, method, body });
    const result = handler(url, method, body);
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

const conflict = (): MockResponse => ({
  ok: false,
  status: 409,
  body: { success: false, message: 'User with email [x] already exists' },
});

function studentsRouter(students: User[]) {
  return (url: string, method: string): MockResponse => {
    if (url === '/notifications/unread/count') return success(0);
    if (url.startsWith('/users') && method === 'GET') return success(students);
    if (url.startsWith('/users/') && method === 'PUT') {
      const id = Number(url.split('/')[2]);
      const target = students.find((s) => s.id === id);
      return success(target ?? students[0]);
    }
    if (url.startsWith('/users/') && method === 'DELETE') {
      return { ok: true, status: 204, body: null };
    }
    return failure();
  };
}

function renderAdminStudents() {
  return render(
    <MemoryRouter initialEntries={['/admin/students']}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('AdminStudentsPage', () => {
  let calls: RecordedCall[];

  beforeEach(() => {
    localStorage.clear();
    calls = [];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders page header with title and description', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(studentsRouter([activeStudent]), calls));

    renderAdminStudents();

    expect(await screen.findByRole('heading', { name: 'Học viên' })).toBeTruthy();
    expect(
      await screen.findByText('Quản lý tài khoản học viên của trung tâm.'),
    ).toBeTruthy();
  });

  it('calls GET /api/users with role STUDENT', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(studentsRouter([activeStudent]), calls));

    renderAdminStudents();

    await screen.findByText('Học viên 10');

    const listCall = calls.find(
      (call) => call.url.startsWith('/users') && call.method === 'GET',
    );
    expect(listCall).toBeTruthy();
    expect(listCall!.url).toContain('role=STUDENT');
  });

  it('renders students with ACTIVE and INACTIVE badges', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(studentsRouter([activeStudent, inactiveStudent]), calls),
    );

    renderAdminStudents();

    await screen.findByText('Học viên 10');
    await screen.findByText('Học viên 11');

    const rowActive = screen.getByText('Học viên 10').closest('tr');
    expect(rowActive).not.toBeNull();
    expect(within(rowActive as HTMLElement).getByText('Đang hoạt động')).toBeTruthy();

    const rowInactive = screen.getByText('Học viên 11').closest('tr');
    expect(rowInactive).not.toBeNull();
    expect(within(rowInactive as HTMLElement).getByText('Vô hiệu hóa')).toBeTruthy();

    expect(screen.getByText('student10@example.com')).toBeTruthy();
    expect(screen.getByText('0903344556')).toBeTruthy();
  });

  it('filters students by search keyword client-side', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(studentsRouter([activeStudent, inactiveStudent]), calls),
    );

    renderAdminStudents();

    await screen.findByText('Học viên 10');

    fireEvent.change(screen.getByLabelText('Tìm kiếm học viên'), {
      target: { value: 'học viên 11' },
    });

    await waitFor(() => {
      expect(screen.queryByText('Học viên 10')).toBeNull();
    });
    expect(screen.getByText('Học viên 11')).toBeTruthy();
  });

  it('filters students by status', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(studentsRouter([activeStudent, inactiveStudent]), calls),
    );

    renderAdminStudents();

    await screen.findByText('Học viên 10');

    fireEvent.change(screen.getByLabelText('Lọc theo trạng thái'), {
      target: { value: 'INACTIVE' },
    });

    await waitFor(() => {
      expect(screen.queryByText('Học viên 10')).toBeNull();
    });
    expect(screen.getByText('Học viên 11')).toBeTruthy();
  });

  it('opens edit modal with student values', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(studentsRouter([activeStudent]), calls));

    renderAdminStudents();

    await screen.findByText('Học viên 10');
    fireEvent.click(screen.getByRole('button', { name: 'Sửa Học viên 10' }));

    expect(await screen.findByRole('dialog', { name: 'Cập nhật học viên' })).toBeTruthy();
    expect(screen.getByLabelText(/Họ tên/)).toBeTruthy();
    expect((screen.getByLabelText(/Email/) as HTMLInputElement).value).toBe(
      'student10@example.com',
    );
  });

  it('submits edit with PUT payload, role STUDENT and no passwordHash', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(studentsRouter([activeStudent]), calls));

    renderAdminStudents();

    await screen.findByText('Học viên 10');
    fireEvent.click(screen.getByRole('button', { name: 'Sửa Học viên 10' }));
    await screen.findByRole('dialog', { name: 'Cập nhật học viên' });

    fireEvent.change(screen.getByLabelText(/Họ tên/), {
      target: { value: 'Học viên Mới' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    await waitFor(() => {
      const putCall = calls.find(
        (call) => call.url === '/users/10' && call.method === 'PUT',
      );
      expect(putCall).toBeTruthy();
    });
    const putCall = calls.find((call) => call.url === '/users/10' && call.method === 'PUT')!;
    const payload = putCall.body as Record<string, unknown>;
    expect(payload.fullName).toBe('Học viên Mới');
    expect(payload.email).toBe('student10@example.com');
    expect(payload.role).toBe('STUDENT');
    expect(payload).not.toHaveProperty('passwordHash');
  });

  it('shows inline email error on 409 duplicate email', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    const handler = (url: string, method: string): MockResponse => {
      if (url === '/notifications/unread/count') return success(0);
      if (url.startsWith('/users') && method === 'GET') return success([activeStudent]);
      if (url.startsWith('/users/') && method === 'PUT') return conflict();
      return failure();
    };
    vi.stubGlobal('fetch', createFetchMock(handler, calls));

    renderAdminStudents();

    await screen.findByText('Học viên 10');
    fireEvent.click(screen.getByRole('button', { name: 'Sửa Học viên 10' }));
    await screen.findByRole('dialog', { name: 'Cập nhật học viên' });

    fireEvent.change(screen.getByLabelText(/Email/), {
      target: { value: 'taken@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    expect(await screen.findByText('Email đã tồn tại')).toBeTruthy();
  });

  it('deactivates student after confirmation and reloads', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(studentsRouter([activeStudent]), calls));

    renderAdminStudents();

    await screen.findByText('Học viên 10');
    fireEvent.click(screen.getByRole('button', { name: 'Vô hiệu hóa Học viên 10' }));

    expect(await screen.findByRole('dialog', { name: 'Vô hiệu hóa học viên?' })).toBeTruthy();
    expect(
      screen.getByText(
        'Vô hiệu hóa học viên này? Tài khoản sẽ chuyển INACTIVE, dữ liệu liên quan giữ nguyên.',
      ),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));

    await waitFor(() => {
      const deleteCall = calls.find(
        (call) => call.url === '/users/10' && call.method === 'DELETE',
      );
      expect(deleteCall).toBeTruthy();
    });
  });

  it('reactivates INACTIVE student with PUT status ACTIVE', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(studentsRouter([inactiveStudent]), calls));

    renderAdminStudents();

    await screen.findByText('Học viên 11');
    fireEvent.click(screen.getByRole('button', { name: 'Kích hoạt lại Học viên 11' }));

    await waitFor(() => {
      const putCall = calls.find(
        (call) => call.url === '/users/11' && call.method === 'PUT',
      );
      expect(putCall).toBeTruthy();
    });
    const putCall = calls.find(
      (call) => call.url === '/users/11' && call.method === 'PUT',
    )!;
    expect((putCall.body as Record<string, unknown>).status).toBe('ACTIVE');
    expect((putCall.body as Record<string, unknown>).role).toBe('STUDENT');
  });

  it('shows empty state when there are no students', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(studentsRouter([]), calls));

    renderAdminStudents();

    expect(await screen.findByText('Chưa có học viên nào')).toBeTruthy();
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

    renderAdminStudents();

    expect(await screen.findByText('Không thể tải danh sách học viên')).toBeTruthy();

    vi.stubGlobal('fetch', createFetchMock(studentsRouter([activeStudent]), calls));
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Học viên 10')).toBeTruthy();
  });

  it('shows loading skeleton while fetching', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    let resolveFetch: (value: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input).replace('/api', '');
      if (url === '/notifications/unread/count') {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ success: true, data: 0, message: 'OK' }) });
      }
      if (url.startsWith('/users')) {
        return fetchPromise;
      }
      return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({ success: false, message: 'Internal server error' }) });
    });
    vi.stubGlobal('fetch', fetchMock);

    renderAdminStudents();

    expect(screen.getByRole('status', { name: 'Đang tải danh sách học viên' })).toBeTruthy();
    expect(screen.getAllByTestId('skeleton-row').length).toBeGreaterThanOrEqual(4);

    resolveFetch!({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data: [activeStudent], message: 'OK' }),
    });
    await fetchPromise;

    await screen.findByText('Học viên 10');
    expect(screen.queryByRole('status', { name: 'Đang tải danh sách học viên' })).toBeNull();
  });

  it('renders AdminStudentsPage for /admin/students instead of PlaceholderPage', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(studentsRouter([activeStudent]), calls));

    renderAdminStudents();

    expect(await screen.findByRole('heading', { name: 'Học viên' })).toBeTruthy();
    expect(screen.queryByText('Chức năng sẽ được triển khai ở các bước tiếp theo.')).toBeNull();
  });

  it('has no create student button or create modal', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(studentsRouter([activeStudent]), calls));

    renderAdminStudents();

    await screen.findByText('Học viên 10');
    expect(screen.queryByRole('button', { name: /Tạo học viên/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Thêm học viên/ })).toBeNull();
    expect(screen.queryByRole('dialog', { name: /Thêm học viên/ })).toBeNull();

    const postCall = calls.find(
      (call) => call.url === '/users' && call.method === 'POST',
    );
    expect(postCall).toBeUndefined();
  });
});
