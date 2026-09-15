import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AppRoutes } from '@/routes/AppRoutes';
import { authStorage } from '@/features/auth/authStorage';
import type { CourseClass } from '@/types/courseClass';
import type { Registration } from '@/types/registration';
import type { Transaction } from '@/types/transaction';
import type { User } from '@/types/user';

const baseUser: Omit<User, 'role' | 'email' | 'fullName'> = {
  id: 100,
  phone: null,
  status: 'ACTIVE',
  avatarUrl: null,
  emailVerifiedAt: null,
  lastLoginAt: null,
  createdAt: '2026-08-01T09:00:00',
  updatedAt: null,
};

const studentUser: User = {
  ...baseUser,
  role: 'STUDENT',
  email: 'student@example.com',
  fullName: 'Hoc Vien Moi',
};

function makeClass(overrides: Partial<CourseClass> & { id: number }): CourseClass {
  return {
    courseId: 1,
    courseName: 'Tieng Anh Beginner',
    name: `Lop ${overrides.id}`,
    teacherId: 5,
    teacherName: 'Giao Vien 5',
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

const upcomingClass = makeClass({ id: 10, name: 'Lop Sang 01' });
const fullStudyingClass = makeClass({
  id: 11,
  name: 'Lop Toi Day',
  status: 'STUDYING',
  currentHeadcount: 20,
  maxCapacity: 20,
});
const finishedClass = makeClass({ id: 12, name: 'Lop Cu', status: 'FINISHED' });
const cancelledClass = makeClass({ id: 13, name: 'Lop Huy', status: 'CANCELLED' });
const rejectedOnlyClass = makeClass({ id: 14, name: 'Lop Moi' });
const approvedClass = makeClass({ id: 15, name: 'Lop Chieu', status: 'STUDYING' });
const failedTxClass = makeClass({ id: 16, name: 'Lop Dem', status: 'STUDYING' });
const successTxClass = makeClass({ id: 17, name: 'Lop Som', status: 'STUDYING' });

const allClasses = [
  upcomingClass,
  fullStudyingClass,
  finishedClass,
  cancelledClass,
  rejectedOnlyClass,
  approvedClass,
  failedTxClass,
  successTxClass,
];

function makeRegistration(overrides: Partial<Registration> & { id: number }): Registration {
  return {
    studentId: 100,
    studentName: 'Hoc Vien Moi',
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

const pendingReg = makeRegistration({ id: 1 });
const approvedNoTxReg = makeRegistration({
  id: 2,
  classId: 11,
  className: 'Lop Toi Day',
  status: 'APPROVED',
});
const rejectedReg = makeRegistration({ id: 3, status: 'REJECTED' });
const rejectedOnlyReg = makeRegistration({ id: 4, classId: 14, className: 'Lop Moi', status: 'REJECTED' });
const paidReg = makeRegistration({ id: 5, classId: 12, className: 'Lop Cu', status: 'PAID' });
const approvedUnpaidReg = makeRegistration({
  id: 6,
  classId: 15,
  className: 'Lop Chieu',
  status: 'APPROVED',
});
const approvedFailedReg = makeRegistration({
  id: 7,
  classId: 16,
  className: 'Lop Dem',
  status: 'APPROVED',
});
const approvedSuccessReg = makeRegistration({
  id: 8,
  classId: 17,
  className: 'Lop Som',
  status: 'APPROVED',
});

const allRegistrations = [
  pendingReg,
  approvedNoTxReg,
  rejectedReg,
  rejectedOnlyReg,
  paidReg,
  approvedUnpaidReg,
  approvedFailedReg,
  approvedSuccessReg,
];

function makeTransaction(overrides: Partial<Transaction> & { id: number }): Transaction {
  return {
    registrationId: 6,
    studentId: 100,
    studentName: 'Hoc Vien Moi',
    classId: 15,
    className: 'Lop Chieu',
    courseName: 'Tieng Anh Beginner',
    amount: 1500000,
    paymentMethod: 'BANK_TRANSFER',
    transactionCode: `TXN${overrides.id}`,
    status: 'PENDING_CONFIRMATION',
    createdAt: '2026-08-12T09:00:00',
    paidAt: null,
    confirmedAt: null,
    confirmedById: null,
    confirmedByName: null,
    updatedAt: '2026-08-12T09:00:00',
    ...overrides,
  };
}

const unpaidTx = makeTransaction({ id: 61, registrationId: 6 });
const oldPendingTx = makeTransaction({ id: 71, registrationId: 7 });
const latestFailedTx = makeTransaction({ id: 72, registrationId: 7, status: 'FAILED' });
const oldFailedTx = makeTransaction({ id: 81, registrationId: 8, status: 'FAILED' });
const successTx = makeTransaction({
  id: 82,
  registrationId: 8,
  status: 'SUCCESS',
  paidAt: '2026-08-12T10:00:00',
  confirmedAt: '2026-08-13T10:00:00',
  confirmedById: 1,
  confirmedByName: 'Quan Tri Vien',
});

const allTransactions = [unpaidTx, oldPendingTx, latestFailedTx, oldFailedTx, successTx];

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

const created = (data: unknown): MockResponse => ({
  ok: true,
  status: 201,
  body: { success: true, data, message: 'Created' },
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

interface RouterData {
  classes: CourseClass[];
  registrations: Registration[];
  transactions: Transaction[];
}

interface RouterOverrides {
  onCreateRegistration?: () => MockResponse;
  onCreateTransaction?: () => MockResponse;
}

function studentRouter(data: RouterData, overrides?: RouterOverrides) {
  return (url: string, method: string, body: unknown): MockResponse => {
    if (url === '/notifications/unread/count') return success(0);
    if (url.startsWith('/classes') && method === 'GET') return success(data.classes);
    if (url.startsWith('/registrations') && method === 'GET') return success(data.registrations);
    if (url.startsWith('/transactions') && method === 'GET') return success(data.transactions);
    if (url === '/registrations' && method === 'POST') {
      if (overrides?.onCreateRegistration) return overrides.onCreateRegistration();
      return created({ ...pendingReg, id: 99 });
    }    const cancelMatch = url.match(/^\/registrations\/(\d+)\/cancel$/);
    if (cancelMatch && method === 'PUT') return { ok: true, status: 204, body: null };
    if (url === '/transactions' && method === 'POST') {
      if (overrides?.onCreateTransaction) return overrides.onCreateTransaction();
      const payload = body as { registrationId: number };
      return created({ ...unpaidTx, id: 90, registrationId: payload.registrationId });
    }
    const reportMatch = url.match(/^\/transactions\/(\d+)\/report-paid$/);
    if (reportMatch && method === 'PUT') {
      const target = data.transactions.find((t) => t.id === Number(reportMatch[1]));
      return success({ ...target, paidAt: '2026-08-14T10:00:00' });
    }
    return failure();
  };
}

function renderStudentRegistrations() {
  return render(
    <MemoryRouter initialEntries={['/student/registrations']}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

const defaultData: RouterData = {
  classes: allClasses,
  registrations: allRegistrations,
  transactions: allTransactions,
};

describe('StudentRegistrationsPage', () => {
  let calls: RecordedCall[];

  beforeEach(() => {
    localStorage.clear();
    calls = [];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('redirects unauthenticated users to login via ProtectedRoute', async () => {
    vi.stubGlobal('fetch', createFetchMock(studentRouter(defaultData), calls));

    renderStudentRegistrations();

    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeTruthy();
    expect(screen.queryByText('Đăng ký của tôi')).toBeNull();
  });

  it('renders page header as STUDENT with stored session and fetches notification count', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentRouter(defaultData), calls));

    renderStudentRegistrations();

    expect(await screen.findByRole('heading', { name: 'Đăng ký' })).toBeTruthy();
    expect(await screen.findByText('Đăng ký của tôi')).toBeTruthy();
    expect(await screen.findByText('Lớp có thể đăng ký')).toBeTruthy();
    await waitFor(() => {
      expect(calls.some((c) => c.url === '/notifications/unread/count')).toBe(true);
    });
  });

  it('shows skeleton while loading', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentRouter(defaultData), calls));

    renderStudentRegistrations();

    expect(screen.getByLabelText('Đang tải dữ liệu đăng ký')).toBeTruthy();
    await screen.findByText('Đăng ký của tôi');
  });

  it('loads own registrations, classes and transactions', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentRouter(defaultData), calls));

    renderStudentRegistrations();

    await screen.findByText('Đăng ký của tôi');
    const regCalls = calls.filter((c) => c.url.startsWith('/registrations') && c.method === 'GET');
    expect(regCalls.length).toBe(1);
    expect(regCalls[0].url).toContain('studentId=100');
    expect(calls.some((c) => c.url.startsWith('/classes') && c.method === 'GET')).toBe(true);
    expect(calls.some((c) => c.url.startsWith('/transactions') && c.method === 'GET')).toBe(true);
  });

  it('renders UPCOMING and STUDYING classes but hides FINISHED and CANCELLED', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentRouter(defaultData), calls));

    renderStudentRegistrations();

    await screen.findByText('Đăng ký của tôi');
    const classSection = within(screen.getByRole('region', { name: 'Lớp có thể đăng ký' }));
    expect(classSection.getByText('Lop Sang 01')).toBeTruthy();
    expect(classSection.getByText('Lop Toi Day')).toBeTruthy();
    expect(classSection.queryByText('Lop Cu')).toBeNull();
    expect(classSection.queryByText('Lop Huy')).toBeNull();
  });

  it('shows full class as full without hard-blocking the register flow', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(
        studentRouter({ classes: [fullStudyingClass], registrations: [], transactions: [] }),
        calls,
      ),
    );

    renderStudentRegistrations();

    await screen.findByText('Đăng ký của tôi');
    expect(screen.getByText('Đã đầy')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Đăng ký lớp Lop Toi Day' })).toBeTruthy();
  });

  it('hides the register button for classes with an active registration', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentRouter(defaultData), calls));

    renderStudentRegistrations();

    await screen.findByText('Đăng ký của tôi');
    expect(screen.queryByRole('button', { name: 'Đăng ký lớp Lop Sang 01' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Đăng ký lớp Lop Toi Day' })).toBeNull();
  });

  it('allows registering again after REJECTED', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentRouter(defaultData), calls));

    renderStudentRegistrations();

    await screen.findByText('Đăng ký của tôi');
    expect(screen.getByRole('button', { name: 'Đăng ký lớp Lop Moi' })).toBeTruthy();
  });

  it('creates a registration with POST and the correct body', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentRouter(defaultData), calls));

    renderStudentRegistrations();

    await screen.findByText('Đăng ký của tôi');
    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký lớp Lop Moi' }));
    expect(await screen.findByText('Xác nhận đăng ký')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));

    await waitFor(() => {
      const post = calls.find((c) => c.url === '/registrations' && c.method === 'POST');
      expect(post).toBeTruthy();
      expect(post?.body).toEqual({ studentId: 100, classId: 14 });
    });
    await waitFor(() => {
      const regCalls = calls.filter((c) => c.url.startsWith('/registrations') && c.method === 'GET');
      expect(regCalls.length).toBe(2);
    });
  });

  it('shows backend 400 message when registration create fails', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(
        studentRouter(defaultData, {
          onCreateRegistration: () => badRequest('Cannot register for a CANCELLED class'),
        }),
        calls,
      ),
    );

    renderStudentRegistrations();

    await screen.findByText('Đăng ký của tôi');
    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký lớp Lop Moi' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận' }));

    expect(await screen.findByText('Cannot register for a CANCELLED class')).toBeTruthy();
  });

  it('cancels a PENDING registration via PUT cancel', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentRouter(defaultData), calls));

    renderStudentRegistrations();

    await screen.findByText('Đăng ký của tôi');
    fireEvent.click(screen.getByRole('button', { name: 'Hủy đăng ký 1' }));
    expect(await screen.findByText('Hủy đăng ký?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));

    await waitFor(() => {
      expect(calls.some((c) => c.url === '/registrations/1/cancel' && c.method === 'PUT')).toBe(true);
    });
  });

  it('cancels an APPROVED registration via PUT cancel', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentRouter(defaultData), calls));

    renderStudentRegistrations();

    await screen.findByText('Đăng ký của tôi');
    fireEvent.click(screen.getByRole('button', { name: 'Hủy đăng ký 2' }));
    expect(await screen.findByText('Hủy đăng ký?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));

    await waitFor(() => {
      expect(calls.some((c) => c.url === '/registrations/2/cancel' && c.method === 'PUT')).toBe(true);
    });
  });

  it('offers no cancel action for a PAID registration', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentRouter(defaultData), calls));

    renderStudentRegistrations();

    await screen.findByText('Đăng ký của tôi');
    expect(screen.queryByRole('button', { name: 'Hủy đăng ký 5' })).toBeNull();
  });

  it('renders registration status badges with tuition and date', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentRouter(defaultData), calls));

    renderStudentRegistrations();

    await screen.findByText('Đăng ký của tôi');
    expect(screen.getAllByText('Chờ duyệt').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Đã duyệt').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Từ chối').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Đã thanh toán').length).toBeGreaterThan(0);
  });

  it('creates a transaction for an APPROVED registration without transactions', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentRouter(defaultData), calls));

    renderStudentRegistrations();

    await screen.findByText('Đăng ký của tôi');
    fireEvent.click(screen.getByRole('button', { name: 'Tạo giao dịch cho đăng ký 2' }));
    expect(await screen.findByText('Tạo giao dịch thanh toán')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));

    await waitFor(() => {
      const post = calls.find((c) => c.url === '/transactions' && c.method === 'POST');
      expect(post).toBeTruthy();
      expect(post?.body).toEqual({ registrationId: 2 });
    });
  });

  it('shows backend 400 message when transaction create fails', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(
        studentRouter(defaultData, {
          onCreateTransaction: () => badRequest('Only APPROVED registrations can be paid'),
        }),
        calls,
      ),
    );

    renderStudentRegistrations();

    await screen.findByText('Đăng ký của tôi');
    fireEvent.click(screen.getByRole('button', { name: 'Tạo giao dịch cho đăng ký 2' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận' }));

    expect(await screen.findByText('Only APPROVED registrations can be paid')).toBeTruthy();
  });

  it('reports paid for the latest unpaid PENDING transaction', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentRouter(defaultData), calls));

    renderStudentRegistrations();

    await screen.findByText('Đăng ký của tôi');
    fireEvent.click(screen.getByRole('button', { name: 'Báo đã thanh toán giao dịch 61' }));
    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByText('Báo đã thanh toán')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));

    await waitFor(() => {
      expect(calls.some((c) => c.url === '/transactions/61/report-paid' && c.method === 'PUT')).toBe(true);
    });
  });

  it('creates a transaction again when the latest transaction FAILED', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentRouter(defaultData), calls));

    renderStudentRegistrations();

    await screen.findByText('Đăng ký của tôi');
    expect(screen.getByRole('button', { name: 'Tạo giao dịch lại cho đăng ký 7' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Báo đã thanh toán giao dịch 71' })).toBeNull();
  });

  it('prefers SUCCESS over other transactions of the same registration', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentRouter(defaultData), calls));

    renderStudentRegistrations();

    await screen.findByText('Đăng ký của tôi');
    expect(screen.queryByRole('button', { name: 'Tạo giao dịch cho đăng ký 8' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Tạo giao dịch lại cho đăng ký 8' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Báo đã thanh toán giao dịch 82' })).toBeNull();
    // APPROVED vẫn được Hủy theo backend contract (chỉ PAID bị cấm).
    expect(screen.getByRole('button', { name: 'Hủy đăng ký 8' })).toBeTruthy();
  });

  it('treats a PAID registration as terminal', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentRouter(defaultData), calls));

    renderStudentRegistrations();

    await screen.findByText('Đăng ký của tôi');
    expect(screen.queryByRole('button', { name: 'Tạo giao dịch cho đăng ký 5' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Báo đã thanh toán giao dịch 5' })).toBeNull();
  });

  it('shows waiting text for a reported transaction without a report button', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(
        studentRouter({
          classes: [approvedClass],
          registrations: [approvedUnpaidReg],
          transactions: [{ ...unpaidTx, paidAt: '2026-08-14T10:00:00' }],
        }),
        calls,
      ),
    );

    renderStudentRegistrations();

    await screen.findByText('Đăng ký của tôi');
    expect(await screen.findByText('Đã báo, chờ Admin xác nhận')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Báo đã thanh toán giao dịch 61' })).toBeNull();
  });

  it('shows permission error on 403', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(
        studentRouter(defaultData, {
          onCreateTransaction: () => forbidden(),
        }),
        calls,
      ),
    );

    renderStudentRegistrations();

    await screen.findByText('Đăng ký của tôi');
    fireEvent.click(screen.getByRole('button', { name: 'Tạo giao dịch cho đăng ký 2' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận' }));

    expect(await screen.findByText('Không có quyền thực hiện thao tác này.')).toBeTruthy();
  });

  it('shows error state with retry and reloads on retry', async () => {
    authStorage.setSession('jwt.student', studentUser);
    let regCalls = 0;
    vi.stubGlobal(
      'fetch',
      createFetchMock((url, method, body) => {
        if (url === '/notifications/unread/count') return success(0);
        if (url.startsWith('/registrations') && method === 'GET') {
          regCalls += 1;
          return regCalls === 1 ? failure() : success([pendingReg]);
        }
        return studentRouter({ classes: [upcomingClass], registrations: [], transactions: [] })(
          url,
          method,
          body,
        );
      }, calls),
    );

    renderStudentRegistrations();

    expect(await screen.findByText('Không thể tải dữ liệu đăng ký')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Đăng ký của tôi')).toBeTruthy();
  });

  it('shows empty states for classes and registrations', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(studentRouter({ classes: [], registrations: [], transactions: [] }), calls),
    );

    renderStudentRegistrations();

    expect(await screen.findByText('Không có lớp phù hợp để đăng ký.')).toBeTruthy();
    expect(screen.getByText('Chưa có đăng ký nào.')).toBeTruthy();
  });

  it('renders no payment gateway or QR UI', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(studentRouter(defaultData), calls));

    renderStudentRegistrations();

    await screen.findByText('Đăng ký của tôi');
    expect(screen.queryByText(/QR/i)).toBeNull();
    expect(screen.queryByText(/gateway/i)).toBeNull();
  });
});
