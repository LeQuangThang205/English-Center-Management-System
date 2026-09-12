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

function makeTeacher(overrides: Partial<User> & { id: number }): User {
  return {
    ...baseUser,
    role: 'TEACHER',
    email: `teacher${overrides.id}@example.com`,
    fullName: `Giáo viên ${overrides.id}`,
    phone: '0903344556',
    ...overrides,
  };
}

const activeTeacher = makeTeacher({ id: 10 });
const inactiveTeacher = makeTeacher({ id: 11, status: 'INACTIVE', phone: '0904455667' });

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

function teachersRouter(teachers: User[]) {
  return (url: string, method: string): MockResponse => {
    if (url === '/notifications/unread/count') return success(0);
    if (url.startsWith('/users') && method === 'GET') return success(teachers);
    if (url.startsWith('/users/') && method === 'PUT') {
      const id = Number(url.split('/')[2]);
      const target = teachers.find((t) => t.id === id);
      return success(target ?? teachers[0]);
    }
    if (url.startsWith('/users/') && method === 'DELETE') {
      return { ok: true, status: 204, body: null };
    }
    return failure();
  };
}

function renderAdminTeachers() {
  return render(
    <MemoryRouter initialEntries={['/admin/teachers']}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('AdminTeachersPage', () => {
  let calls: RecordedCall[];

  beforeEach(() => {
    localStorage.clear();
    calls = [];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('redirects unauthenticated users to login via ProtectedRoute', async () => {
    vi.stubGlobal('fetch', createFetchMock(teachersRouter([activeTeacher]), calls));

    renderAdminTeachers();

    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Giáo viên' })).toBeNull();
  });

  it('renders page header with title and description', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(teachersRouter([activeTeacher]), calls));

    renderAdminTeachers();

    expect(await screen.findByRole('heading', { name: 'Giáo viên' })).toBeTruthy();
    expect(
      await screen.findByText('Quản lý tài khoản giáo viên của trung tâm.'),
    ).toBeTruthy();
  });

  it('calls GET /api/users with role TEACHER', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(teachersRouter([activeTeacher]), calls));

    renderAdminTeachers();

    await screen.findByText('Giáo viên 10');

    const listCall = calls.find(
      (call) => call.url.startsWith('/users') && call.method === 'GET',
    );
    expect(listCall).toBeTruthy();
    expect(listCall!.url).toContain('role=TEACHER');
  });

  it('renders teachers with ACTIVE and INACTIVE badges', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(teachersRouter([activeTeacher, inactiveTeacher]), calls),
    );

    renderAdminTeachers();

    await screen.findByText('Giáo viên 10');
    await screen.findByText('Giáo viên 11');

    const rowActive = screen.getByText('Giáo viên 10').closest('tr');
    expect(rowActive).not.toBeNull();
    expect(within(rowActive as HTMLElement).getByText('Đang hoạt động')).toBeTruthy();

    const rowInactive = screen.getByText('Giáo viên 11').closest('tr');
    expect(rowInactive).not.toBeNull();
    expect(within(rowInactive as HTMLElement).getByText('Vô hiệu hóa')).toBeTruthy();

    expect(screen.getByText('teacher10@example.com')).toBeTruthy();
    expect(screen.getByText('0903344556')).toBeTruthy();
  });

  it('filters teachers by search keyword (name and email) client-side', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(teachersRouter([activeTeacher, inactiveTeacher]), calls),
    );

    renderAdminTeachers();

    await screen.findByText('Giáo viên 10');

    fireEvent.change(screen.getByLabelText('Tìm kiếm giáo viên'), {
      target: { value: 'giáo viên 11' },
    });

    await waitFor(() => {
      expect(screen.queryByText('Giáo viên 10')).toBeNull();
    });
    expect(screen.getByText('Giáo viên 11')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Tìm kiếm giáo viên'), {
      target: { value: 'teacher10@example.com' },
    });

    await waitFor(() => {
      expect(screen.queryByText('Giáo viên 11')).toBeNull();
    });
    expect(screen.getByText('Giáo viên 10')).toBeTruthy();
  });

  it('filters teachers by status', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(teachersRouter([activeTeacher, inactiveTeacher]), calls),
    );

    renderAdminTeachers();

    await screen.findByText('Giáo viên 10');

    fireEvent.change(screen.getByLabelText('Lọc theo trạng thái'), {
      target: { value: 'INACTIVE' },
    });

    await waitFor(() => {
      expect(screen.queryByText('Giáo viên 10')).toBeNull();
    });
    expect(screen.getByText('Giáo viên 11')).toBeTruthy();
  });

  it('opens edit modal with teacher values and readonly TEACHER role', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(teachersRouter([activeTeacher]), calls));

    renderAdminTeachers();

    await screen.findByText('Giáo viên 10');
    fireEvent.click(screen.getByRole('button', { name: 'Sửa Giáo viên 10' }));

    expect(await screen.findByRole('dialog', { name: 'Cập nhật giáo viên' })).toBeTruthy();
    expect(screen.getByLabelText(/Họ tên/)).toBeTruthy();
    expect((screen.getByLabelText(/Email/) as HTMLInputElement).value).toBe(
      'teacher10@example.com',
    );
    expect((screen.getByLabelText(/Vai trò/) as HTMLInputElement).value).toBe(
      'Giáo viên (TEACHER)',
    );
  });

  it('blocks submit with required, email and phone validation errors', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(teachersRouter([activeTeacher]), calls));

    renderAdminTeachers();

    await screen.findByText('Giáo viên 10');
    fireEvent.click(screen.getByRole('button', { name: 'Sửa Giáo viên 10' }));
    await screen.findByRole('dialog', { name: 'Cập nhật giáo viên' });

    fireEvent.change(screen.getByLabelText(/Họ tên/), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'not-an-email' } });
    fireEvent.change(screen.getByLabelText(/Số điện thoại/), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    expect(await screen.findByText('Họ tên không được để trống')).toBeTruthy();
    expect(screen.getByText('Email không hợp lệ')).toBeTruthy();
    expect(screen.getByText('Số điện thoại không hợp lệ')).toBeTruthy();

    const putCall = calls.find(
      (call) => call.url === '/users/10' && call.method === 'PUT',
    );
    expect(putCall).toBeUndefined();
  });

  it('submits edit with PUT payload, role TEACHER and no passwordHash', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(teachersRouter([activeTeacher]), calls));

    renderAdminTeachers();

    await screen.findByText('Giáo viên 10');
    fireEvent.click(screen.getByRole('button', { name: 'Sửa Giáo viên 10' }));
    await screen.findByRole('dialog', { name: 'Cập nhật giáo viên' });

    fireEvent.change(screen.getByLabelText(/Họ tên/), {
      target: { value: 'Giáo viên Mới' },
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
    expect(payload.fullName).toBe('Giáo viên Mới');
    expect(payload.email).toBe('teacher10@example.com');
    expect(payload.role).toBe('TEACHER');
    expect(payload).not.toHaveProperty('passwordHash');
  });

  it('shows inline email error on 409 duplicate email', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    const handler = (url: string, method: string): MockResponse => {
      if (url === '/notifications/unread/count') return success(0);
      if (url.startsWith('/users') && method === 'GET') return success([activeTeacher]);
      if (url.startsWith('/users/') && method === 'PUT') return conflict();
      return failure();
    };
    vi.stubGlobal('fetch', createFetchMock(handler, calls));

    renderAdminTeachers();

    await screen.findByText('Giáo viên 10');
    fireEvent.click(screen.getByRole('button', { name: 'Sửa Giáo viên 10' }));
    await screen.findByRole('dialog', { name: 'Cập nhật giáo viên' });

    fireEvent.change(screen.getByLabelText(/Email/), {
      target: { value: 'taken@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    expect(await screen.findByText('Email đã tồn tại')).toBeTruthy();
  });

  it('deactivates teacher after confirmation and reloads', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(teachersRouter([activeTeacher]), calls));

    renderAdminTeachers();

    await screen.findByText('Giáo viên 10');
    fireEvent.click(screen.getByRole('button', { name: 'Vô hiệu hóa Giáo viên 10' }));

    expect(await screen.findByRole('dialog', { name: 'Vô hiệu hóa giáo viên?' })).toBeTruthy();
    expect(
      screen.getByText(
        'Vô hiệu hóa giáo viên này? Tài khoản sẽ chuyển INACTIVE, dữ liệu liên quan giữ nguyên.',
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

  it('reactivates INACTIVE teacher with PUT status ACTIVE', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(teachersRouter([inactiveTeacher]), calls));

    renderAdminTeachers();

    await screen.findByText('Giáo viên 11');
    fireEvent.click(screen.getByRole('button', { name: 'Kích hoạt lại Giáo viên 11' }));

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
    expect((putCall.body as Record<string, unknown>).role).toBe('TEACHER');
  });

  it('shows empty and filtered-empty states', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(teachersRouter([]), calls));

    renderAdminTeachers();

    expect(await screen.findByText('Chưa có giáo viên nào')).toBeTruthy();
  });

  it('shows filtered-empty state when search matches nothing', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(teachersRouter([activeTeacher]), calls));

    renderAdminTeachers();

    await screen.findByText('Giáo viên 10');

    fireEvent.change(screen.getByLabelText('Tìm kiếm giáo viên'), {
      target: { value: 'không-tồn-tại' },
    });

    expect(await screen.findByText('Không tìm thấy giáo viên phù hợp')).toBeTruthy();
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

    renderAdminTeachers();

    expect(await screen.findByText('Không thể tải danh sách giáo viên')).toBeTruthy();

    vi.stubGlobal('fetch', createFetchMock(teachersRouter([activeTeacher]), calls));
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Giáo viên 10')).toBeTruthy();
  });

  it('renders AdminTeachersPage for /admin/teachers instead of PlaceholderPage', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(teachersRouter([activeTeacher]), calls));

    renderAdminTeachers();

    expect(await screen.findByRole('heading', { name: 'Giáo viên' })).toBeTruthy();
    expect(screen.queryByText('Chức năng sẽ được triển khai ở các bước tiếp theo.')).toBeNull();
  });

  it('has no create teacher button and never POSTs /api/users', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(teachersRouter([activeTeacher]), calls));

    renderAdminTeachers();

    await screen.findByText('Giáo viên 10');
    expect(screen.queryByRole('button', { name: /Tạo giáo viên/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Thêm giáo viên/ })).toBeNull();
    expect(screen.queryByRole('dialog', { name: /Thêm giáo viên/ })).toBeNull();

    const postCall = calls.find(
      (call) => call.url === '/users' && call.method === 'POST',
    );
    expect(postCall).toBeUndefined();
  });
});
