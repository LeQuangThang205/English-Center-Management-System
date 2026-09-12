import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AppRoutes } from '@/routes/AppRoutes';
import { authStorage } from '@/features/auth/authStorage';
import type { Course } from '@/types/course';
import type { CourseClass } from '@/types/courseClass';
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

const teacherUser: User = {
  ...baseUser,
  id: 5,
  role: 'TEACHER',
  email: 'teacher5@example.com',
  fullName: 'Giáo viên 5',
  phone: '0901122334',
};

const activeCourse: Course = {
  id: 1,
  name: 'Tiếng Anh Beginner',
  description: null,
  tuition: 3000000,
  level: 'BEGINNER',
  duration: 12,
  status: 'ACTIVE',
};

function makeClass(overrides: Partial<CourseClass> & { id: number }): CourseClass {
  return {
    courseId: 1,
    courseName: 'Tiếng Anh Beginner',
    name: `Lớp ${overrides.id}`,
    teacherId: 5,
    teacherName: 'Giáo viên 5',
    maxCapacity: 20,
    currentHeadcount: 8,
    scheduleDay: 'MON',
    startTime: '18:00:00',
    endTime: '19:30:00',
    room: 'P101',
    startDate: '2026-09-01',
    endDate: '2026-12-01',
    status: 'UPCOMING',
    createdAt: '2026-08-01T09:00:00',
    updatedAt: null,
    ...overrides,
  };
}

const upcomingClass = makeClass({ id: 100 });
const studyingClass = makeClass({ id: 101, name: 'Lớp 101', status: 'STUDYING', room: 'P202', currentHeadcount: 12 });
const cancelledClass = makeClass({ id: 102, name: 'Lớp 102', status: 'CANCELLED', currentHeadcount: 5, maxCapacity: 15 });

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

const badRequest = (message: string): MockResponse => ({
  ok: false,
  status: 400,
  body: { success: false, message },
});

interface RouterData {
  classes: CourseClass[];
  courses?: Course[];
  teachers?: User[];
}

function classesRouter(data: RouterData, overrides?: {
  onPost?: () => MockResponse;
  onPut?: () => MockResponse;
}) {
  return (url: string, method: string, body: unknown): MockResponse => {
    if (url === '/notifications/unread/count') return success(0);
    if (url === '/classes' && method === 'GET') return success(data.classes);
    if (url === '/courses' && method === 'GET') return success(data.courses ?? [activeCourse]);
    if (url.startsWith('/users') && method === 'GET') return success(data.teachers ?? [teacherUser]);
    if (url === '/classes' && method === 'POST') {
      if (overrides?.onPost) return overrides.onPost();
      return {
        ok: true,
        status: 201,
        body: { success: true, data: { ...(body as object), id: 200 }, message: 'Class created successfully' },
      };
    }
    if (url.startsWith('/classes/') && method === 'PUT') {
      if (overrides?.onPut) return overrides.onPut();
      const id = Number(url.split('/')[2]);
      const target = data.classes.find((c) => c.id === id);
      return success({ ...(target ?? data.classes[0]), ...(body as object) });
    }
    if (url.startsWith('/classes/') && method === 'DELETE') {
      return { ok: true, status: 204, body: null };
    }
    return failure();
  };
}

function renderAdminClasses() {
  return render(
    <MemoryRouter initialEntries={['/admin/classes']}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

function fillCreateForm() {
  fireEvent.change(screen.getByLabelText(/Khóa học/), { target: { value: '1' } });
  fireEvent.change(screen.getByLabelText(/Tên lớp/), { target: { value: 'Lớp Mới' } });
  fireEvent.change(screen.getByLabelText(/Giáo viên/), { target: { value: '5' } });
  fireEvent.change(screen.getByLabelText(/Sức chứa tối đa/), { target: { value: '25' } });
  fireEvent.change(screen.getByLabelText(/Ngày học trong tuần/), { target: { value: 'TUE' } });
  fireEvent.change(screen.getByLabelText(/Giờ bắt đầu/), { target: { value: '18:00' } });
  fireEvent.change(screen.getByLabelText(/Giờ kết thúc/), { target: { value: '19:30' } });
  fireEvent.change(screen.getByLabelText(/Phòng học/), { target: { value: 'P303' } });
  fireEvent.change(screen.getByLabelText(/Ngày bắt đầu/), { target: { value: '2026-09-01' } });
  fireEvent.change(screen.getByLabelText(/Ngày kết thúc/), { target: { value: '2026-12-01' } });
}

describe('AdminClassesPage', () => {
  let calls: RecordedCall[];

  beforeEach(() => {
    localStorage.clear();
    calls = [];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('redirects unauthenticated users to login via ProtectedRoute', async () => {
    vi.stubGlobal('fetch', createFetchMock(classesRouter({ classes: [upcomingClass] }), calls));

    renderAdminClasses();

    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Lớp học' })).toBeNull();
  });

  it('renders page header with create action', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(classesRouter({ classes: [upcomingClass] }), calls));

    renderAdminClasses();

    expect(await screen.findByRole('heading', { name: 'Lớp học' })).toBeTruthy();
    expect(
      await screen.findByText('Quản lý các lớp học của trung tâm.'),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Thêm lớp học' })).toBeTruthy();
  });

  it('calls GET /classes without query params and preloads courses and teachers', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(classesRouter({ classes: [upcomingClass] }), calls));

    renderAdminClasses();

    await screen.findByText('Lớp 100');

    const listCall = calls.find(
      (call) => call.url.startsWith('/classes') && call.method === 'GET',
    );
    expect(listCall).toBeTruthy();
    expect(listCall!.url).toBe('/classes');

    const coursesCall = calls.find((call) => call.url === '/courses' && call.method === 'GET');
    expect(coursesCall).toBeTruthy();

    const teachersCall = calls.find(
      (call) => call.url.startsWith('/users') && call.method === 'GET',
    );
    expect(teachersCall).toBeTruthy();
    expect(teachersCall!.url).toContain('role=TEACHER');
  });

  it('renders rows with course, schedule, headcount and status badges', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(classesRouter({ classes: [upcomingClass, studyingClass, cancelledClass] }), calls),
    );

    renderAdminClasses();

    await screen.findByText('Lớp 100');
    await screen.findByText('Lớp 101');
    await screen.findByText('Lớp 102');

    expect(screen.getAllByText('Tiếng Anh Beginner').length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText('8 / 20')).toBeTruthy();
    expect(screen.getByText('12 / 20')).toBeTruthy();
    expect(screen.getByText('5 / 15')).toBeTruthy();

    const rowUpcoming = screen.getByText('Lớp 100').closest('tr');
    expect(within(rowUpcoming as HTMLElement).getByText('Sắp khai giảng')).toBeTruthy();
    const rowStudying = screen.getByText('Lớp 101').closest('tr');
    expect(within(rowStudying as HTMLElement).getByText('Đang học')).toBeTruthy();
    const rowCancelled = screen.getByText('Lớp 102').closest('tr');
    expect(within(rowCancelled as HTMLElement).getByText('Đã hủy')).toBeTruthy();
  });

  it('filters classes by search keyword (name and room)', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(classesRouter({ classes: [upcomingClass, studyingClass] }), calls),
    );

    renderAdminClasses();

    await screen.findByText('Lớp 100');

    fireEvent.change(screen.getByLabelText('Tìm kiếm lớp học'), {
      target: { value: 'P202' },
    });

    await waitFor(() => {
      expect(screen.queryByText('Lớp 100')).toBeNull();
    });
    expect(screen.getByText('Lớp 101')).toBeTruthy();
  });

  it('filters classes by status', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(classesRouter({ classes: [upcomingClass, studyingClass] }), calls),
    );

    renderAdminClasses();

    await screen.findByText('Lớp 100');

    fireEvent.change(screen.getByLabelText('Lọc theo trạng thái'), {
      target: { value: 'STUDYING' },
    });

    await waitFor(() => {
      expect(screen.queryByText('Lớp 100')).toBeNull();
    });
    expect(screen.getByText('Lớp 101')).toBeTruthy();
  });

  it('filters classes by course', async () => {
    const otherCourse: Course = { ...activeCourse, id: 2, name: 'Tiếng Anh Giao tiếp' };
    const otherClass = makeClass({ id: 103, name: 'Lớp 103', courseId: 2, courseName: 'Tiếng Anh Giao tiếp' });
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(
        classesRouter({ classes: [upcomingClass, otherClass], courses: [activeCourse, otherCourse] }),
        calls,
      ),
    );

    renderAdminClasses();

    await screen.findByText('Lớp 100');

    fireEvent.change(screen.getByLabelText('Lọc theo khóa học'), {
      target: { value: '2' },
    });

    await waitFor(() => {
      expect(screen.queryByText('Lớp 100')).toBeNull();
    });
    expect(screen.getByText('Lớp 103')).toBeTruthy();
  });

  it('opens create modal with UPCOMING default and submits full POST payload', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(classesRouter({ classes: [upcomingClass] }), calls));

    renderAdminClasses();

    await screen.findByText('Lớp 100');
    fireEvent.click(screen.getByRole('button', { name: 'Thêm lớp học' }));

    expect(await screen.findByRole('dialog', { name: 'Thêm lớp học' })).toBeTruthy();
    expect((screen.getByLabelText(/Trạng thái/) as HTMLSelectElement).value).toBe('UPCOMING');

    fillCreateForm();
    fireEvent.click(screen.getByRole('button', { name: 'Tạo lớp học' }));

    await waitFor(() => {
      const postCall = calls.find((call) => call.url === '/classes' && call.method === 'POST');
      expect(postCall).toBeTruthy();
    });
    const payload = calls.find((call) => call.url === '/classes' && call.method === 'POST')!.body as Record<
      string,
      unknown
    >;
    expect(payload.courseId).toBe(1);
    expect(payload.name).toBe('Lớp Mới');
    expect(payload.teacherId).toBe(5);
    expect(payload.maxCapacity).toBe(25);
    expect(payload.scheduleDay).toBe('TUE');
    expect(payload.startTime).toBe('18:00');
    expect(payload.endTime).toBe('19:30');
    expect(payload.room).toBe('P303');
    expect(payload.startDate).toBe('2026-09-01');
    expect(payload.endDate).toBe('2026-12-01');
    expect(payload.status).toBe('UPCOMING');
    expect(payload).not.toHaveProperty('currentHeadcount');
  });

  it('blocks create when capacity is not positive', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(classesRouter({ classes: [upcomingClass] }), calls));

    renderAdminClasses();

    await screen.findByText('Lớp 100');
    fireEvent.click(screen.getByRole('button', { name: 'Thêm lớp học' }));
    await screen.findByRole('dialog', { name: 'Thêm lớp học' });

    fillCreateForm();
    fireEvent.change(screen.getByLabelText(/Sức chứa tối đa/), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tạo lớp học' }));

    expect(await screen.findByText('Sức chứa phải là số nguyên lớn hơn 0')).toBeTruthy();
    expect(calls.find((call) => call.url === '/classes' && call.method === 'POST')).toBeUndefined();
  });

  it('blocks create when startDate is after endDate', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(classesRouter({ classes: [upcomingClass] }), calls));

    renderAdminClasses();

    await screen.findByText('Lớp 100');
    fireEvent.click(screen.getByRole('button', { name: 'Thêm lớp học' }));
    await screen.findByRole('dialog', { name: 'Thêm lớp học' });

    fillCreateForm();
    fireEvent.change(screen.getByLabelText(/Ngày bắt đầu/), { target: { value: '2026-12-02' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tạo lớp học' }));

    expect(await screen.findByText('Ngày kết thúc phải sau ngày bắt đầu')).toBeTruthy();
    expect(calls.find((call) => call.url === '/classes' && call.method === 'POST')).toBeUndefined();
  });

  it('blocks create when startTime is not before endTime', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(classesRouter({ classes: [upcomingClass] }), calls));

    renderAdminClasses();

    await screen.findByText('Lớp 100');
    fireEvent.click(screen.getByRole('button', { name: 'Thêm lớp học' }));
    await screen.findByRole('dialog', { name: 'Thêm lớp học' });

    fillCreateForm();
    fireEvent.change(screen.getByLabelText(/Giờ kết thúc/), { target: { value: '18:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tạo lớp học' }));

    expect(await screen.findByText('Giờ kết thúc phải sau giờ bắt đầu')).toBeTruthy();
    expect(calls.find((call) => call.url === '/classes' && call.method === 'POST')).toBeUndefined();
  });

  it('opens edit modal prefilled with readonly course and PUTs without courseId', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(classesRouter({ classes: [upcomingClass] }), calls));

    renderAdminClasses();

    await screen.findByText('Lớp 100');
    fireEvent.click(screen.getByRole('button', { name: 'Sửa Lớp 100' }));

    expect(await screen.findByRole('dialog', { name: 'Cập nhật lớp học' })).toBeTruthy();
    expect((screen.getByLabelText(/Tên lớp/) as HTMLInputElement).value).toBe('Lớp 100');
    expect((screen.getByLabelText(/Khóa học/) as HTMLInputElement).value).toBe('Tiếng Anh Beginner');
    expect(screen.queryByLabelText(/Khóa học/)?.tagName).not.toBe('SELECT');

    fireEvent.change(screen.getByLabelText(/Phòng học/), { target: { value: 'P404' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    await waitFor(() => {
      expect(calls.find((call) => call.url === '/classes/100' && call.method === 'PUT')).toBeTruthy();
    });
    const payload = calls.find((call) => call.url === '/classes/100' && call.method === 'PUT')!.body as Record<
      string,
      unknown
    >;
    expect(payload.room).toBe('P404');
    expect(payload).not.toHaveProperty('courseId');
    expect(payload).not.toHaveProperty('currentHeadcount');
  });

  it('sends teacherId null when unassigning teacher on edit', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(classesRouter({ classes: [upcomingClass] }), calls));

    renderAdminClasses();

    await screen.findByText('Lớp 100');
    fireEvent.click(screen.getByRole('button', { name: 'Sửa Lớp 100' }));
    await screen.findByRole('dialog', { name: 'Cập nhật lớp học' });

    fireEvent.change(screen.getByLabelText(/Giáo viên/), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    await waitFor(() => {
      expect(calls.find((call) => call.url === '/classes/100' && call.method === 'PUT')).toBeTruthy();
    });
    const payload = calls.find((call) => call.url === '/classes/100' && call.method === 'PUT')!.body as Record<
      string,
      unknown
    >;
    expect(payload.teacherId).toBeNull();
  });

  it('blocks edit when capacity is below current headcount (FE guard)', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(classesRouter({ classes: [upcomingClass] }), calls));

    renderAdminClasses();

    await screen.findByText('Lớp 100');
    fireEvent.click(screen.getByRole('button', { name: 'Sửa Lớp 100' }));
    await screen.findByRole('dialog', { name: 'Cập nhật lớp học' });

    fireEvent.change(screen.getByLabelText(/Sức chứa tối đa/), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    expect(await screen.findByText('Sức chứa không được nhỏ hơn sĩ số hiện tại (8)')).toBeTruthy();
    expect(calls.find((call) => call.url === '/classes/100' && call.method === 'PUT')).toBeUndefined();
  });

  it('shows backend 400 message inline and keeps modal open', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(
        classesRouter({ classes: [upcomingClass] }, { onPut: () => badRequest('maxCapacity must be greater than 0') }),
        calls,
      ),
    );

    renderAdminClasses();

    await screen.findByText('Lớp 100');
    fireEvent.click(screen.getByRole('button', { name: 'Sửa Lớp 100' }));
    await screen.findByRole('dialog', { name: 'Cập nhật lớp học' });

    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    expect(await screen.findByText('maxCapacity must be greater than 0')).toBeTruthy();
    expect(screen.getByRole('dialog', { name: 'Cập nhật lớp học' })).toBeTruthy();
  });

  it('cancels class after confirmation via DELETE and reloads', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(classesRouter({ classes: [upcomingClass] }), calls));

    renderAdminClasses();

    await screen.findByText('Lớp 100');
    fireEvent.click(screen.getByRole('button', { name: 'Hủy Lớp 100' }));

    expect(await screen.findByRole('dialog', { name: 'Hủy lớp học?' })).toBeTruthy();
    expect(
      screen.getByText('Hủy lớp học này? Lớp sẽ chuyển CANCELLED, dữ liệu đăng ký giữ nguyên.'),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));

    await waitFor(() => {
      expect(calls.find((call) => call.url === '/classes/100' && call.method === 'DELETE')).toBeTruthy();
    });
  });

  it('hides cancel action but keeps edit for CANCELLED classes', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(classesRouter({ classes: [cancelledClass] }), calls));

    renderAdminClasses();

    await screen.findByText('Lớp 102');
    expect(screen.queryByRole('button', { name: 'Hủy Lớp 102' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Sửa Lớp 102' })).toBeTruthy();
  });

  it('shows empty and filtered-empty states', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(classesRouter({ classes: [] }), calls));

    renderAdminClasses();

    expect(await screen.findByText('Chưa có lớp học nào')).toBeTruthy();
  });

  it('shows filtered-empty state when search matches nothing', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(classesRouter({ classes: [upcomingClass] }), calls));

    renderAdminClasses();

    await screen.findByText('Lớp 100');

    fireEvent.change(screen.getByLabelText('Tìm kiếm lớp học'), {
      target: { value: 'không-tồn-tại' },
    });

    expect(await screen.findByText('Không tìm thấy lớp phù hợp')).toBeTruthy();
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

    renderAdminClasses();

    expect(await screen.findByText('Không thể tải danh sách lớp học')).toBeTruthy();

    vi.stubGlobal('fetch', createFetchMock(classesRouter({ classes: [upcomingClass] }), calls));
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Lớp 100')).toBeTruthy();
  });

  it('renders AdminClassesPage for /admin/classes instead of PlaceholderPage', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(classesRouter({ classes: [upcomingClass] }), calls));

    renderAdminClasses();

    expect(await screen.findByRole('heading', { name: 'Lớp học' })).toBeTruthy();
    expect(screen.queryByText('Chức năng sẽ được triển khai ở các bước tiếp theo.')).toBeNull();
  });
});
