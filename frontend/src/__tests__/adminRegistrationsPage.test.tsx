import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AppRoutes } from '@/routes/AppRoutes';
import { authStorage } from '@/features/auth/authStorage';
import type { CourseClass } from '@/types/courseClass';
import type { Registration } from '@/types/registration';
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
  fullName: 'Quan Tri Vien',
};

function makeClass(overrides: Partial<CourseClass> & { id: number }): CourseClass {
  return {
    courseId: 1,
    courseName: 'Tieng Anh Beginner',
    name: `Lop ${overrides.id}`,
    teacherId: 5,
    teacherName: 'Giao vien 5',
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

const classMorning = makeClass({ id: 10, name: 'Lop Sang 01' });
const classEvening = makeClass({ id: 11, name: 'Lop Chieu 02', courseName: 'Tieng Anh Intermediate' });

function makeRegistration(overrides: Partial<Registration> & { id: number }): Registration {
  return {
    studentId: 100 + overrides.id,
    studentName: `Hoc vien ${overrides.id}`,
    classId: 10,
    className: 'Lop Sang 01',
    courseName: 'Tieng Anh Beginner',
    status: 'PENDING',
    tuitionAtRegistration: 1500000,
    registeredAt: '2026-08-10T09:00:00',
    approvedAt: null,
    approvedById: null,
    approvedByName: null,
    rejectedAt: null,
    rejectedById: null,
    rejectedByName: null,
    rejectionReason: null,
    paidAt: null,
    createdAt: '2026-08-10T09:00:00',
    updatedAt: '2026-08-10T09:00:00',
    ...overrides,
  };
}

const pendingReg = makeRegistration({ id: 1, studentName: 'Nguyen Van A' });
const approvedReg = makeRegistration({
  id: 2,
  studentName: 'Tran Thi B',
  status: 'APPROVED',
  approvedAt: '2026-08-11T10:00:00',
  approvedById: 1,
  approvedByName: 'Quan Tri Vien',
});
const rejectedReg = makeRegistration({
  id: 3,
  studentName: 'Le Van C',
  classId: 11,
  className: 'Lop Chieu 02',
  courseName: 'Tieng Anh Intermediate',
  status: 'REJECTED',
  rejectedAt: '2026-08-12T10:00:00',
  rejectedById: 1,
  rejectedByName: 'Quan Tri Vien',
  rejectionReason: 'Lop da day',
});
const paidReg = makeRegistration({
  id: 4,
  studentName: 'Pham Thi D',
  classId: 11,
  className: 'Lop Chieu 02',
  courseName: 'Tieng Anh Intermediate',
  status: 'PAID',
  approvedAt: '2026-08-11T10:00:00',
  approvedById: 1,
  approvedByName: 'Quan Tri Vien',
  paidAt: '2026-08-13T10:00:00',
});
const cancelledReg = makeRegistration({ id: 5, studentName: 'Hoang Van E', status: 'CANCELLED' });

const allRegistrations = [pendingReg, approvedReg, rejectedReg, paidReg, cancelledReg];

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

const forbidden = (): MockResponse => ({
  ok: false,
  status: 403,
  body: { success: false, message: 'Access denied' },
});

const notFound = (): MockResponse => ({
  ok: false,
  status: 404,
  body: { success: false, message: 'Registration not found with id 999' },
});

interface RouterData {
  registrations: Registration[];
}

interface RouterOverrides {
  onApprove?: () => MockResponse;
  onReject?: () => MockResponse;
  onCancel?: () => MockResponse;
  onMarkPaid?: () => MockResponse;
  onDetail?: () => MockResponse;
  onList?: () => MockResponse;
}

function registrationsRouter(data: RouterData, overrides?: RouterOverrides) {
  return (url: string, method: string, body: unknown): MockResponse => {
    if (url === '/notifications/unread/count') return success(0);
    if (url === '/classes' && method === 'GET') return success([classMorning, classEvening]);
    if (url === '/registrations' && method === 'GET') {
      if (overrides?.onList) return overrides.onList();
      return success(data.registrations);
    }
    const match = url.match(/^\/registrations\/(\d+)(\/(approve|reject|cancel|mark-paid))?$/);
    if (match && method === 'GET' && !match[3]) {
      if (overrides?.onDetail) return overrides.onDetail();
      const target = data.registrations.find((r) => r.id === Number(match[1]));
      if (!target) return notFound();
      return success(target);
    }
    if (match && method === 'PUT' && match[3] === 'approve') {
      if (overrides?.onApprove) return overrides.onApprove();
      const target = data.registrations.find((r) => r.id === Number(match[1]));
      return success({ ...target, status: 'APPROVED' });
    }
    if (match && method === 'PUT' && match[3] === 'reject') {
      if (overrides?.onReject) return overrides.onReject();
      const target = data.registrations.find((r) => r.id === Number(match[1]));
      return success({
        ...target,
        status: 'REJECTED',
        rejectionReason: (body as { reason?: string })?.reason ?? null,
      });
    }
    if (match && method === 'PUT' && match[3] === 'cancel') {
      if (overrides?.onCancel) return overrides.onCancel();
      return { ok: true, status: 204, body: null };
    }
    if (match && method === 'PUT' && match[3] === 'mark-paid') {
      if (overrides?.onMarkPaid) return overrides.onMarkPaid();
      const target = data.registrations.find((r) => r.id === Number(match[1]));
      return success({ ...target, status: 'PAID' });
    }
    return failure();
  };
}

function renderAdminRegistrations() {
  return render(
    <MemoryRouter initialEntries={['/admin/registrations']}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

function rowOf(studentName: string): HTMLElement {
  const cell = screen.getByText(studentName);
  const row = cell.closest('tr');
  if (!row) throw new Error(`Row not found for ${studentName}`);
  return row as HTMLElement;
}

describe('AdminRegistrationsPage', () => {
  let calls: RecordedCall[];

  beforeEach(() => {
    localStorage.clear();
    calls = [];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('redirects unauthenticated users to login via ProtectedRoute', async () => {
    vi.stubGlobal('fetch', createFetchMock(registrationsRouter({ registrations: allRegistrations }), calls));

    renderAdminRegistrations();

    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Đăng ký' })).toBeNull();
  });

  it('renders page header as ADMIN with stored session and fetches notification count', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(registrationsRouter({ registrations: allRegistrations }), calls));

    renderAdminRegistrations();

    expect(await screen.findByRole('heading', { name: 'Đăng ký' })).toBeTruthy();
    expect(
      await screen.findByText('Xem và xử lý các yêu cầu đăng ký khóa học của học viên.'),
    ).toBeTruthy();
    await waitFor(() => {
      expect(calls.some((c) => c.url === '/notifications/unread/count')).toBe(true);
    });
  });

  it('shows skeleton while loading registrations', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(registrationsRouter({ registrations: allRegistrations }), calls));

    renderAdminRegistrations();

    expect(screen.getByLabelText('Đang tải danh sách đăng ký')).toBeTruthy();
    await screen.findByText('Nguyen Van A');
  });

  it('loads registrations with a single GET without combined query params', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(registrationsRouter({ registrations: allRegistrations }), calls));

    renderAdminRegistrations();

    await screen.findByText('Nguyen Van A');
    const listCalls = calls.filter((c) => c.url.startsWith('/registrations') && c.method === 'GET' && !c.url.includes('/registrations/'));
    expect(listCalls.length).toBe(1);
    expect(listCalls[0].url).toBe('/registrations');
  });

  it('defaults status filter to PENDING and hides other statuses', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(registrationsRouter({ registrations: allRegistrations }), calls));

    renderAdminRegistrations();

    await screen.findByText('Nguyen Van A');
    expect(screen.getByLabelText('Lọc theo trạng thái')).toBeTruthy();
    expect((screen.getByLabelText('Lọc theo trạng thái') as HTMLSelectElement).value).toBe('PENDING');
    expect(screen.queryByText('Tran Thi B')).toBeNull();
    expect(screen.queryByText('Le Van C')).toBeNull();
    expect(screen.queryByText('Pham Thi D')).toBeNull();
    expect(screen.queryByText('Hoang Van E')).toBeNull();
  });

  it('ALL status filter shows every registration', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(registrationsRouter({ registrations: allRegistrations }), calls));

    renderAdminRegistrations();

    await screen.findByText('Nguyen Van A');
    fireEvent.change(screen.getByLabelText('Lọc theo trạng thái'), { target: { value: 'ALL' } });

    expect(await screen.findByText('Tran Thi B')).toBeTruthy();
    expect(screen.getByText('Le Van C')).toBeTruthy();
    expect(screen.getByText('Pham Thi D')).toBeTruthy();
    expect(screen.getByText('Hoang Van E')).toBeTruthy();
  });

  it('filters client-side by status APPROVED', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(registrationsRouter({ registrations: allRegistrations }), calls));

    renderAdminRegistrations();

    await screen.findByText('Nguyen Van A');
    fireEvent.change(screen.getByLabelText('Lọc theo trạng thái'), { target: { value: 'APPROVED' } });

    expect(await screen.findByText('Tran Thi B')).toBeTruthy();
    expect(screen.queryByText('Nguyen Van A')).toBeNull();
    const listCalls = calls.filter((c) => c.url === '/registrations' && c.method === 'GET');
    expect(listCalls.length).toBe(1);
  });

  it('filters client-side by class', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(registrationsRouter({ registrations: [pendingReg, rejectedReg] }), calls));

    renderAdminRegistrations();

    await screen.findByLabelText('Lọc theo trạng thái');
    fireEvent.change(screen.getByLabelText('Lọc theo trạng thái'), { target: { value: 'ALL' } });
    await screen.findByText('Le Van C');
    fireEvent.change(screen.getByLabelText('Lọc theo lớp học'), { target: { value: '11' } });

    expect(screen.queryByText('Nguyen Van A')).toBeNull();
    expect(screen.getByText('Le Van C')).toBeTruthy();
  });

  it('searches by student, class and course name client-side', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(registrationsRouter({ registrations: allRegistrations }), calls));

    renderAdminRegistrations();

    await screen.findByLabelText('Lọc theo trạng thái');
    fireEvent.change(screen.getByLabelText('Lọc theo trạng thái'), { target: { value: 'ALL' } });
    await screen.findByText('Pham Thi D');

    fireEvent.change(screen.getByLabelText('Tìm kiếm đăng ký'), { target: { value: 'tran thi b' } });
    expect(screen.getByText('Tran Thi B')).toBeTruthy();
    expect(screen.queryByText('Nguyen Van A')).toBeNull();

    fireEvent.change(screen.getByLabelText('Tìm kiếm đăng ký'), { target: { value: 'Lop Chieu 02' } });
    expect(screen.getByText('Le Van C')).toBeTruthy();
    expect(screen.queryByText('Nguyen Van A')).toBeNull();

    fireEvent.change(screen.getByLabelText('Tìm kiếm đăng ký'), { target: { value: 'Intermediate' } });
    expect(screen.getByText('Pham Thi D')).toBeTruthy();
    expect(screen.queryByText('Nguyen Van A')).toBeNull();
  });

  it('renders registration tuition, date and status badge', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(registrationsRouter({ registrations: [pendingReg] }), calls));

    renderAdminRegistrations();

    await screen.findByText('Nguyen Van A');
    const row = within(rowOf('Nguyen Van A'));
    expect(row.getByText('Lop Sang 01')).toBeTruthy();
    expect(row.getByText('Tieng Anh Beginner')).toBeTruthy();
    expect(row.getByText('Chờ duyệt')).toBeTruthy();
  });

  it('PENDING row offers approve, reject, cancel and detail actions', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(registrationsRouter({ registrations: [pendingReg] }), calls));

    renderAdminRegistrations();

    await screen.findByText('Nguyen Van A');
    const row = within(rowOf('Nguyen Van A'));
    expect(row.getByRole('button', { name: 'Duyệt đơn đăng ký 1' })).toBeTruthy();
    expect(row.getByRole('button', { name: 'Từ chối đơn đăng ký 1' })).toBeTruthy();
    expect(row.getByRole('button', { name: 'Hủy đơn đăng ký 1' })).toBeTruthy();
    expect(row.getByRole('button', { name: 'Xem đơn đăng ký 1' })).toBeTruthy();
    expect(row.queryByRole('button', { name: 'Đánh dấu thanh toán đơn đăng ký 1' })).toBeNull();
  });

  it('APPROVED row offers mark-paid, cancel and detail but no approve or reject', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(registrationsRouter({ registrations: [approvedReg] }), calls));

    renderAdminRegistrations();

    await screen.findByLabelText('Lọc theo trạng thái');
    fireEvent.change(screen.getByLabelText('Lọc theo trạng thái'), { target: { value: 'APPROVED' } });
    await screen.findByText('Tran Thi B');
    const row = within(rowOf('Tran Thi B'));
    expect(row.getByRole('button', { name: 'Đánh dấu thanh toán đơn đăng ký 2' })).toBeTruthy();
    expect(row.getByRole('button', { name: 'Hủy đơn đăng ký 2' })).toBeTruthy();
    expect(row.getByRole('button', { name: 'Xem đơn đăng ký 2' })).toBeTruthy();
    expect(row.queryByRole('button', { name: 'Duyệt đơn đăng ký 2' })).toBeNull();
    expect(row.queryByRole('button', { name: 'Từ chối đơn đăng ký 2' })).toBeNull();
  });

  it('REJECTED row offers only cancel and detail', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(registrationsRouter({ registrations: [rejectedReg] }), calls));

    renderAdminRegistrations();

    await screen.findByLabelText('Lọc theo trạng thái');
    fireEvent.change(screen.getByLabelText('Lọc theo trạng thái'), { target: { value: 'REJECTED' } });
    await screen.findByText('Le Van C');
    const row = within(rowOf('Le Van C'));
    expect(row.getByRole('button', { name: 'Hủy đơn đăng ký 3' })).toBeTruthy();
    expect(row.getByRole('button', { name: 'Xem đơn đăng ký 3' })).toBeTruthy();
    expect(row.queryByRole('button', { name: 'Duyệt đơn đăng ký 3' })).toBeNull();
    expect(row.queryByRole('button', { name: 'Từ chối đơn đăng ký 3' })).toBeNull();
    expect(row.queryByRole('button', { name: 'Đánh dấu thanh toán đơn đăng ký 3' })).toBeNull();
  });

  it('PAID row is read-only with detail only', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(registrationsRouter({ registrations: [paidReg] }), calls));

    renderAdminRegistrations();

    await screen.findByLabelText('Lọc theo trạng thái');
    fireEvent.change(screen.getByLabelText('Lọc theo trạng thái'), { target: { value: 'PAID' } });
    await screen.findByText('Pham Thi D');
    const row = within(rowOf('Pham Thi D'));
    expect(row.getByRole('button', { name: 'Xem đơn đăng ký 4' })).toBeTruthy();
    expect(row.queryByRole('button', { name: 'Hủy đơn đăng ký 4' })).toBeNull();
    expect(row.queryByRole('button', { name: 'Đánh dấu thanh toán đơn đăng ký 4' })).toBeNull();
    expect(row.getByText('Đã thanh toán')).toBeTruthy();
  });

  it('CANCELLED row is read-only with detail only', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(registrationsRouter({ registrations: [cancelledReg] }), calls));

    renderAdminRegistrations();

    await screen.findByLabelText('Lọc theo trạng thái');
    fireEvent.change(screen.getByLabelText('Lọc theo trạng thái'), { target: { value: 'CANCELLED' } });
    await screen.findByText('Hoang Van E');
    const row = within(rowOf('Hoang Van E'));
    expect(row.getByRole('button', { name: 'Xem đơn đăng ký 5' })).toBeTruthy();
    expect(row.queryByRole('button', { name: 'Hủy đơn đăng ký 5' })).toBeNull();
  });

  it('approve sends PUT to the approve endpoint and reloads the list', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(registrationsRouter({ registrations: [pendingReg] }), calls));

    renderAdminRegistrations();

    await screen.findByText('Nguyen Van A');
    fireEvent.click(within(rowOf('Nguyen Van A')).getByRole('button', { name: 'Duyệt đơn đăng ký 1' }));
    expect(await screen.findByText('Duyệt đăng ký?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));

    await waitFor(() => {
      expect(calls.some((c) => c.url === '/registrations/1/approve' && c.method === 'PUT')).toBe(true);
    });
    await waitFor(() => {
      const listCalls = calls.filter((c) => c.url === '/registrations' && c.method === 'GET');
      expect(listCalls.length).toBe(2);
    });
  });

  it('reject modal blocks empty reason without sending a request', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(registrationsRouter({ registrations: [pendingReg] }), calls));

    renderAdminRegistrations();

    await screen.findByText('Nguyen Van A');
    fireEvent.click(within(rowOf('Nguyen Van A')).getByRole('button', { name: 'Từ chối đơn đăng ký 1' }));
    expect(await screen.findByLabelText('Lý do từ chối')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận từ chối' }));

    expect(await screen.findByText('Vui lòng nhập lý do từ chối.')).toBeTruthy();
    expect(calls.some((c) => c.url === '/registrations/1/reject')).toBe(false);
  });

  it('reject sends PUT with the trimmed reason body', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(registrationsRouter({ registrations: [pendingReg] }), calls));

    renderAdminRegistrations();

    await screen.findByText('Nguyen Van A');
    fireEvent.click(within(rowOf('Nguyen Van A')).getByRole('button', { name: 'Từ chối đơn đăng ký 1' }));
    fireEvent.change(await screen.findByLabelText('Lý do từ chối'), {
      target: { value: '  Lop da day  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận từ chối' }));

    await waitFor(() => {
      const rejectCall = calls.find((c) => c.url === '/registrations/1/reject' && c.method === 'PUT');
      expect(rejectCall).toBeTruthy();
      expect(rejectCall?.body).toEqual({ reason: 'Lop da day' });
    });
  });

  it('cancel sends PUT to the cancel endpoint', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(registrationsRouter({ registrations: [pendingReg] }), calls));

    renderAdminRegistrations();

    await screen.findByText('Nguyen Van A');
    fireEvent.click(within(rowOf('Nguyen Van A')).getByRole('button', { name: 'Hủy đơn đăng ký 1' }));
    expect(await screen.findByText('Hủy đăng ký?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));

    await waitFor(() => {
      expect(calls.some((c) => c.url === '/registrations/1/cancel' && c.method === 'PUT')).toBe(true);
    });
  });

  it('mark-paid sends PUT to the mark-paid endpoint for APPROVED registrations', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(registrationsRouter({ registrations: [approvedReg] }), calls));

    renderAdminRegistrations();

    await screen.findByLabelText('Lọc theo trạng thái');
    fireEvent.change(screen.getByLabelText('Lọc theo trạng thái'), { target: { value: 'APPROVED' } });
    await screen.findByText('Tran Thi B');
    fireEvent.click(
      within(rowOf('Tran Thi B')).getByRole('button', { name: 'Đánh dấu thanh toán đơn đăng ký 2' }),
    );
    expect(await screen.findByText('Đánh dấu đã thanh toán?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));

    await waitFor(() => {
      expect(calls.some((c) => c.url === '/registrations/2/mark-paid' && c.method === 'PUT')).toBe(true);
    });
  });

  it('detail click fetches GET registration by id and renders audit fields', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(registrationsRouter({ registrations: [rejectedReg] }), calls));

    renderAdminRegistrations();

    await screen.findByLabelText('Lọc theo trạng thái');
    fireEvent.change(screen.getByLabelText('Lọc theo trạng thái'), { target: { value: 'REJECTED' } });
    await screen.findByText('Le Van C');
    expect(calls.some((c) => c.url === '/registrations/3' && c.method === 'GET')).toBe(false);
    fireEvent.click(within(rowOf('Le Van C')).getByRole('button', { name: 'Xem đơn đăng ký 3' }));

    await waitFor(() => {
      expect(calls.some((c) => c.url === '/registrations/3' && c.method === 'GET')).toBe(true);
    });
    expect(await screen.findByText('Chi tiết đăng ký')).toBeTruthy();
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText('Lop da day')).toBeTruthy();
    expect(dialog.getByText('Quan Tri Vien')).toBeTruthy();
  });

  it('approve failure with 400 capacity keeps modal open and shows backend message', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(
        registrationsRouter(
          { registrations: [pendingReg] },
          { onApprove: () => badRequest('Class is already at full capacity') },
        ),
        calls,
      ),
    );

    renderAdminRegistrations();

    await screen.findByText('Nguyen Van A');
    fireEvent.click(within(rowOf('Nguyen Van A')).getByRole('button', { name: 'Duyệt đơn đăng ký 1' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận' }));

    expect(await screen.findByText('Class is already at full capacity')).toBeTruthy();
    expect(screen.getByText('Duyệt đăng ký?')).toBeTruthy();
  });

  it('mutation failure with 403 shows the permission message', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(
        registrationsRouter({ registrations: [pendingReg] }, { onApprove: () => forbidden() }),
        calls,
      ),
    );

    renderAdminRegistrations();

    await screen.findByText('Nguyen Van A');
    fireEvent.click(within(rowOf('Nguyen Van A')).getByRole('button', { name: 'Duyệt đơn đăng ký 1' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận' }));

    expect(await screen.findByText('Không có quyền thực hiện thao tác này.')).toBeTruthy();
  });

  it('detail failure with 404 shows the not-found message', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(
        registrationsRouter({ registrations: [pendingReg] }, { onDetail: () => notFound() }),
        calls,
      ),
    );

    renderAdminRegistrations();

    await screen.findByText('Nguyen Van A');
    fireEvent.click(within(rowOf('Nguyen Van A')).getByRole('button', { name: 'Xem đơn đăng ký 1' }));

    expect(await screen.findByText('Không tìm thấy đăng ký.')).toBeTruthy();
  });

  it('shows empty state when no registrations exist', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(registrationsRouter({ registrations: [] }), calls));

    renderAdminRegistrations();

    expect(await screen.findByText('Chưa có đăng ký nào')).toBeTruthy();
  });

  it('shows filtered empty state when search matches nothing', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(registrationsRouter({ registrations: [pendingReg] }), calls));

    renderAdminRegistrations();

    await screen.findByText('Nguyen Van A');
    fireEvent.change(screen.getByLabelText('Tìm kiếm đăng ký'), { target: { value: 'khong-ton-tai' } });

    expect(await screen.findByText('Không tìm thấy đăng ký phù hợp')).toBeTruthy();
  });

  it('shows error state with retry and reloads on retry', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    let listCalls = 0;
    vi.stubGlobal(
      'fetch',
      createFetchMock(
        registrationsRouter(
          { registrations: [pendingReg] },
          {
            onList: () => {
              listCalls += 1;
              return listCalls === 1 ? failure() : success([pendingReg]);
            },
          },
        ),
        calls,
      ),
    );

    renderAdminRegistrations();

    expect(await screen.findByText('Không thể tải danh sách đăng ký')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Nguyen Van A')).toBeTruthy();
  });

  it('never sends POST or DELETE registration requests across workflow actions', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(registrationsRouter({ registrations: [pendingReg] }), calls));

    renderAdminRegistrations();

    await screen.findByText('Nguyen Van A');
    fireEvent.click(within(rowOf('Nguyen Van A')).getByRole('button', { name: 'Duyệt đơn đăng ký 1' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận' }));
    await waitFor(() => {
      expect(calls.some((c) => c.url === '/registrations/1/approve' && c.method === 'PUT')).toBe(true);
    });

    fireEvent.click(within(rowOf('Nguyen Van A')).getByRole('button', { name: 'Hủy đơn đăng ký 1' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận' }));
    await waitFor(() => {
      expect(calls.some((c) => c.url === '/registrations/1/cancel' && c.method === 'PUT')).toBe(true);
    });

    const registrationCalls = calls.filter((c) => c.url.startsWith('/registrations'));
    expect(registrationCalls.some((c) => c.method === 'POST')).toBe(false);
    expect(registrationCalls.some((c) => c.method === 'DELETE')).toBe(false);
  });
});
