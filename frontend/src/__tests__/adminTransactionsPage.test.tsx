import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AppRoutes } from '@/routes/AppRoutes';
import { authStorage } from '@/features/auth/authStorage';
import type { Transaction } from '@/types/transaction';
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

function makeTransaction(overrides: Partial<Transaction> & { id: number }): Transaction {
  return {
    registrationId: 100 + overrides.id,
    studentId: 200 + overrides.id,
    studentName: `Hoc vien ${overrides.id}`,
    classId: 10,
    className: 'Lop Sang 01',
    courseName: 'Tieng Anh Beginner',
    amount: 1500000,
    paymentMethod: 'BANK_TRANSFER',
    transactionCode: `TXN2026081${overrides.id}`,
    status: 'PENDING_CONFIRMATION',
    createdAt: '2026-08-10T09:00:00',
    paidAt: null,
    confirmedAt: null,
    confirmedById: null,
    confirmedByName: null,
    updatedAt: '2026-08-10T09:00:00',
    ...overrides,
  };
}

const pendingReportedTx = makeTransaction({
  id: 1,
  studentName: 'Nguyen Van A',
  paidAt: '2026-08-12T10:00:00',
});
const pendingUnreportedTx = makeTransaction({ id: 2, studentName: 'Tran Thi B' });
const successTx = makeTransaction({
  id: 3,
  studentName: 'Le Van C',
  status: 'SUCCESS',
  paidAt: '2026-08-12T10:00:00',
  confirmedAt: '2026-08-13T10:00:00',
  confirmedById: 1,
  confirmedByName: 'Quan Tri Vien',
});
const failedTx = makeTransaction({ id: 4, studentName: 'Pham Thi D', status: 'FAILED' });

const allTransactions = [pendingReportedTx, pendingUnreportedTx, successTx, failedTx];

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
  body: { success: false, message: 'Transaction not found with id 999' },
});

interface RouterData {
  transactions: Transaction[];
}

interface RouterOverrides {
  onConfirm?: () => MockResponse;
  onReject?: () => MockResponse;
  onDetail?: () => MockResponse;
  onList?: () => MockResponse;
}

function transactionsRouter(data: RouterData, overrides?: RouterOverrides) {
  return (url: string, method: string): MockResponse => {
    if (url === '/notifications/unread/count') return success(0);
    if (url === '/transactions' && method === 'GET') {
      if (overrides?.onList) return overrides.onList();
      return success(data.transactions);
    }
    const match = url.match(/^\/transactions\/(\d+)(\/(confirm|reject))?$/);
    if (match && method === 'GET' && !match[3]) {
      if (overrides?.onDetail) return overrides.onDetail();
      const target = data.transactions.find((t) => t.id === Number(match[1]));
      if (!target) return notFound();
      return success(target);
    }
    if (match && method === 'PUT' && match[3] === 'confirm') {
      if (overrides?.onConfirm) return overrides.onConfirm();
      const target = data.transactions.find((t) => t.id === Number(match[1]));
      return success({ ...target, status: 'SUCCESS' });
    }
    if (match && method === 'PUT' && match[3] === 'reject') {
      if (overrides?.onReject) return overrides.onReject();
      const target = data.transactions.find((t) => t.id === Number(match[1]));
      return success({ ...target, status: 'FAILED' });
    }
    return failure();
  };
}

function renderAdminTransactions() {
  return render(
    <MemoryRouter initialEntries={['/admin/transactions']}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

function rowOf(transactionCode: string): HTMLElement {
  const cell = screen.getByText(transactionCode);
  const row = cell.closest('tr');
  if (!row) throw new Error(`Row not found for ${transactionCode}`);
  return row as HTMLElement;
}

describe('AdminTransactionsPage', () => {
  let calls: RecordedCall[];

  beforeEach(() => {
    localStorage.clear();
    calls = [];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('redirects unauthenticated users to login via ProtectedRoute', async () => {
    vi.stubGlobal('fetch', createFetchMock(transactionsRouter({ transactions: allTransactions }), calls));

    renderAdminTransactions();

    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Giao dịch' })).toBeNull();
  });

  it('renders page header as ADMIN with stored session and fetches notification count', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(transactionsRouter({ transactions: allTransactions }), calls));

    renderAdminTransactions();

    expect(await screen.findByRole('heading', { name: 'Giao dịch' })).toBeTruthy();
    expect(
      await screen.findByText('Xem và xử lý các giao dịch thanh toán học phí của học viên.'),
    ).toBeTruthy();
    await waitFor(() => {
      expect(calls.some((c) => c.url === '/notifications/unread/count')).toBe(true);
    });
  });

  it('shows skeleton while loading transactions', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(transactionsRouter({ transactions: allTransactions }), calls));

    renderAdminTransactions();

    expect(screen.getByLabelText('Đang tải danh sách giao dịch')).toBeTruthy();
    await screen.findByText('TXN20260811');
  });

  it('loads transactions with a single GET without query params', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(transactionsRouter({ transactions: allTransactions }), calls));

    renderAdminTransactions();

    await screen.findByText('TXN20260811');
    const listCalls = calls.filter((c) => c.url === '/transactions' && c.method === 'GET');
    expect(listCalls.length).toBe(1);
  });

  it('defaults status filter to PENDING_CONFIRMATION and hides other statuses', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(transactionsRouter({ transactions: allTransactions }), calls));

    renderAdminTransactions();

    await screen.findByText('TXN20260811');
    expect((screen.getByLabelText('Lọc theo trạng thái') as HTMLSelectElement).value).toBe(
      'PENDING_CONFIRMATION',
    );
    expect(screen.getByText('TXN20260812')).toBeTruthy();
    expect(screen.queryByText('TXN20260813')).toBeNull();
    expect(screen.queryByText('TXN20260814')).toBeNull();
  });

  it('ALL status filter shows every transaction', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(transactionsRouter({ transactions: allTransactions }), calls));

    renderAdminTransactions();

    await screen.findByLabelText('Lọc theo trạng thái');
    fireEvent.change(screen.getByLabelText('Lọc theo trạng thái'), { target: { value: 'ALL' } });

    expect(await screen.findByText('TXN20260813')).toBeTruthy();
    expect(screen.getByText('TXN20260814')).toBeTruthy();
  });

  it('filters client-side by status SUCCESS without extra list requests', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(transactionsRouter({ transactions: allTransactions }), calls));

    renderAdminTransactions();

    await screen.findByLabelText('Lọc theo trạng thái');
    fireEvent.change(screen.getByLabelText('Lọc theo trạng thái'), { target: { value: 'SUCCESS' } });

    expect(await screen.findByText('TXN20260813')).toBeTruthy();
    expect(screen.queryByText('TXN20260811')).toBeNull();
    const listCalls = calls.filter((c) => c.url === '/transactions' && c.method === 'GET');
    expect(listCalls.length).toBe(1);
  });

  it('searches by transaction code client-side', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(transactionsRouter({ transactions: allTransactions }), calls));

    renderAdminTransactions();

    await screen.findByLabelText('Lọc theo trạng thái');
    fireEvent.change(screen.getByLabelText('Lọc theo trạng thái'), { target: { value: 'ALL' } });
    await screen.findByText('TXN20260814');

    fireEvent.change(screen.getByLabelText('Tìm kiếm giao dịch'), { target: { value: 'txn20260813' } });
    expect(screen.getByText('TXN20260813')).toBeTruthy();
    expect(screen.queryByText('TXN20260811')).toBeNull();
  });

  it('searches by student, class and course name client-side', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(transactionsRouter({ transactions: allTransactions }), calls));

    renderAdminTransactions();

    await screen.findByLabelText('Lọc theo trạng thái');
    fireEvent.change(screen.getByLabelText('Lọc theo trạng thái'), { target: { value: 'ALL' } });
    await screen.findByText('TXN20260814');

    fireEvent.change(screen.getByLabelText('Tìm kiếm giao dịch'), { target: { value: 'le van c' } });
    expect(screen.getByText('Le Van C')).toBeTruthy();
    expect(screen.queryByText('Nguyen Van A')).toBeNull();

    fireEvent.change(screen.getByLabelText('Tìm kiếm giao dịch'), { target: { value: 'Lop Sang 01' } });
    expect(screen.getAllByText('Lop Sang 01').length).toBeGreaterThan(0);
  });

  it('renders amount, dates, payment method and status badge in the row', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(transactionsRouter({ transactions: [pendingReportedTx] }), calls),
    );

    renderAdminTransactions();

    await screen.findByText('TXN20260811');
    const row = within(rowOf('TXN20260811'));
    expect(row.getByText('Nguyen Van A')).toBeTruthy();
    expect(row.getByText('Chuyển khoản')).toBeTruthy();
    expect(row.getByText('Chờ xác nhận')).toBeTruthy();
  });

  it('PENDING_CONFIRMATION row offers confirm, reject and detail actions', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(transactionsRouter({ transactions: [pendingReportedTx] }), calls),
    );

    renderAdminTransactions();

    await screen.findByText('TXN20260811');
    const row = within(rowOf('TXN20260811'));
    expect(row.getByRole('button', { name: 'Xác nhận giao dịch 1' })).toBeTruthy();
    expect(row.getByRole('button', { name: 'Từ chối giao dịch 1' })).toBeTruthy();
    expect(row.getByRole('button', { name: 'Xem giao dịch 1' })).toBeTruthy();
  });

  it('SUCCESS row is read-only with detail only', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(transactionsRouter({ transactions: [successTx] }), calls));

    renderAdminTransactions();

    await screen.findByLabelText('Lọc theo trạng thái');
    fireEvent.change(screen.getByLabelText('Lọc theo trạng thái'), { target: { value: 'SUCCESS' } });
    await screen.findByText('TXN20260813');
    const row = within(rowOf('TXN20260813'));
    expect(row.getByRole('button', { name: 'Xem giao dịch 3' })).toBeTruthy();
    expect(row.queryByRole('button', { name: 'Xác nhận giao dịch 3' })).toBeNull();
    expect(row.queryByRole('button', { name: 'Từ chối giao dịch 3' })).toBeNull();
    expect(row.getByText('Thành công')).toBeTruthy();
  });

  it('FAILED row is read-only with detail only', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(transactionsRouter({ transactions: [failedTx] }), calls));

    renderAdminTransactions();

    await screen.findByLabelText('Lọc theo trạng thái');
    fireEvent.change(screen.getByLabelText('Lọc theo trạng thái'), { target: { value: 'FAILED' } });
    await screen.findByText('TXN20260814');
    const row = within(rowOf('TXN20260814'));
    expect(row.getByRole('button', { name: 'Xem giao dịch 4' })).toBeTruthy();
    expect(row.queryByRole('button', { name: 'Xác nhận giao dịch 4' })).toBeNull();
    expect(row.queryByRole('button', { name: 'Từ chối giao dịch 4' })).toBeNull();
    expect(row.getByText('Thất bại')).toBeTruthy();
  });

  it('confirm modal shows amount and transaction code', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(transactionsRouter({ transactions: [pendingReportedTx] }), calls),
    );

    renderAdminTransactions();

    await screen.findByText('TXN20260811');
    fireEvent.click(within(rowOf('TXN20260811')).getByRole('button', { name: 'Xác nhận giao dịch 1' }));

    expect(await screen.findByText('Xác nhận giao dịch?')).toBeTruthy();
    expect(within(screen.getByRole('dialog')).getByText(/TXN20260811/)).toBeTruthy();
  });

  it('confirm sends PUT to the confirm endpoint and reloads the list', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(transactionsRouter({ transactions: [pendingReportedTx] }), calls),
    );

    renderAdminTransactions();

    await screen.findByText('TXN20260811');
    fireEvent.click(within(rowOf('TXN20260811')).getByRole('button', { name: 'Xác nhận giao dịch 1' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận' }));

    await waitFor(() => {
      expect(calls.some((c) => c.url === '/transactions/1/confirm' && c.method === 'PUT')).toBe(true);
    });
    await waitFor(() => {
      const listCalls = calls.filter((c) => c.url === '/transactions' && c.method === 'GET');
      expect(listCalls.length).toBe(2);
    });
  });

  it('confirm failure with 400 keeps modal open and shows backend message', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(
        transactionsRouter(
          { transactions: [pendingReportedTx] },
          { onConfirm: () => badRequest('Only PENDING_CONFIRMATION transactions can be confirmed') },
        ),
        calls,
      ),
    );

    renderAdminTransactions();

    await screen.findByText('TXN20260811');
    fireEvent.click(within(rowOf('TXN20260811')).getByRole('button', { name: 'Xác nhận giao dịch 1' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận' }));

    expect(
      await screen.findByText('Only PENDING_CONFIRMATION transactions can be confirmed'),
    ).toBeTruthy();
    expect(screen.getByText('Xác nhận giao dịch?')).toBeTruthy();
  });

  it('reject modal has no reason input and sends PUT to the reject endpoint', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(transactionsRouter({ transactions: [pendingReportedTx] }), calls),
    );

    renderAdminTransactions();

    await screen.findByText('TXN20260811');
    fireEvent.click(within(rowOf('TXN20260811')).getByRole('button', { name: 'Từ chối giao dịch 1' }));

    expect(await screen.findByText('Từ chối giao dịch?')).toBeTruthy();
    expect(screen.queryByLabelText(/lý do/i)).toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));

    await waitFor(() => {
      expect(calls.some((c) => c.url === '/transactions/1/reject' && c.method === 'PUT')).toBe(true);
    });
  });

  it('detail click fetches GET transaction by id and renders audit fields', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(transactionsRouter({ transactions: [successTx] }), calls));

    renderAdminTransactions();

    await screen.findByLabelText('Lọc theo trạng thái');
    fireEvent.change(screen.getByLabelText('Lọc theo trạng thái'), { target: { value: 'SUCCESS' } });
    await screen.findByText('TXN20260813');
    expect(calls.some((c) => c.url === '/transactions/3' && c.method === 'GET')).toBe(false);
    fireEvent.click(within(rowOf('TXN20260813')).getByRole('button', { name: 'Xem giao dịch 3' }));

    await waitFor(() => {
      expect(calls.some((c) => c.url === '/transactions/3' && c.method === 'GET')).toBe(true);
    });
    expect(await screen.findByText('Chi tiết giao dịch')).toBeTruthy();
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText('TXN20260813')).toBeTruthy();
    expect(dialog.getByText('Quan Tri Vien')).toBeTruthy();
  });

  it('mutation failure with 403 shows the permission message', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(
        transactionsRouter({ transactions: [pendingReportedTx] }, { onConfirm: () => forbidden() }),
        calls,
      ),
    );

    renderAdminTransactions();

    await screen.findByText('TXN20260811');
    fireEvent.click(within(rowOf('TXN20260811')).getByRole('button', { name: 'Xác nhận giao dịch 1' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận' }));

    expect(await screen.findByText('Không có quyền thực hiện thao tác này.')).toBeTruthy();
  });

  it('detail failure with 404 shows the not-found message', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(
        transactionsRouter({ transactions: [pendingReportedTx] }, { onDetail: () => notFound() }),
        calls,
      ),
    );

    renderAdminTransactions();

    await screen.findByText('TXN20260811');
    fireEvent.click(within(rowOf('TXN20260811')).getByRole('button', { name: 'Xem giao dịch 1' }));

    expect(await screen.findByText('Không tìm thấy giao dịch.')).toBeTruthy();
  });

  it('shows empty state when no transactions exist', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(transactionsRouter({ transactions: [] }), calls));

    renderAdminTransactions();

    expect(await screen.findByText('Chưa có giao dịch nào')).toBeTruthy();
  });

  it('shows filtered empty state when search matches nothing', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(transactionsRouter({ transactions: [pendingReportedTx] }), calls),
    );

    renderAdminTransactions();

    await screen.findByText('TXN20260811');
    fireEvent.change(screen.getByLabelText('Tìm kiếm giao dịch'), { target: { value: 'khong-ton-tai' } });

    expect(await screen.findByText('Không tìm thấy giao dịch phù hợp')).toBeTruthy();
  });

  it('shows error state with retry and reloads on retry', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    let listCalls = 0;
    vi.stubGlobal(
      'fetch',
      createFetchMock(
        transactionsRouter(
          { transactions: [pendingReportedTx] },
          {
            onList: () => {
              listCalls += 1;
              return listCalls === 1 ? failure() : success([pendingReportedTx]);
            },
          },
        ),
        calls,
      ),
    );

    renderAdminTransactions();

    expect(await screen.findByText('Không thể tải danh sách giao dịch')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('TXN20260811')).toBeTruthy();
  });

  it('never sends POST, DELETE or report-paid requests across workflow actions', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(transactionsRouter({ transactions: [pendingReportedTx] }), calls),
    );

    renderAdminTransactions();

    await screen.findByText('TXN20260811');
    fireEvent.click(within(rowOf('TXN20260811')).getByRole('button', { name: 'Xác nhận giao dịch 1' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận' }));
    await waitFor(() => {
      expect(calls.some((c) => c.url === '/transactions/1/confirm' && c.method === 'PUT')).toBe(true);
    });

    fireEvent.click(within(rowOf('TXN20260811')).getByRole('button', { name: 'Từ chối giao dịch 1' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận' }));
    await waitFor(() => {
      expect(calls.some((c) => c.url === '/transactions/1/reject' && c.method === 'PUT')).toBe(true);
    });

    const transactionCalls = calls.filter((c) => c.url.startsWith('/transactions'));
    expect(transactionCalls.some((c) => c.method === 'POST')).toBe(false);
    expect(transactionCalls.some((c) => c.method === 'DELETE')).toBe(false);
    expect(transactionCalls.some((c) => c.url.includes('report-paid'))).toBe(false);
  });
});
