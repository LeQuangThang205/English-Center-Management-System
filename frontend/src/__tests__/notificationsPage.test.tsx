import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AppRoutes } from '@/routes/AppRoutes';
import { authStorage } from '@/features/auth/authStorage';
import { NOTIFICATIONS_CHANGED_EVENT } from '@/features/notifications/useUnreadNotifications';
import type { NotificationRecipient } from '@/types/notification';
import type { User } from '@/types/user';

const baseUser: Omit<User, 'role' | 'email' | 'fullName'> = {
  id: 7,
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

function makeNotification(
  overrides: Partial<NotificationRecipient> & { notificationId: number; title: string },
): NotificationRecipient {
  return {
    id: overrides.notificationId * 10,
    content: 'Nội dung thông báo.',
    targetType: 'ALL_STUDENTS',
    targetId: null,
    attachmentUrl: null,
    createdAt: '2026-08-16T08:30:00',
    isRead: false,
    readAt: null,
    ...overrides,
  };
}

const unread = makeNotification({
  notificationId: 101,
  title: 'Thông báo khai giảng',
  content: 'Lớp IELTS 6.0 sẽ khai giảng vào tuần tới.',
});

const read = makeNotification({
  notificationId: 102,
  title: 'Lịch nghỉ lễ',
  content: 'Trung tâm nghỉ lễ Quốc khánh 2/9.',
  isRead: true,
  readAt: '2026-08-15T12:00:00',
  attachmentUrl: 'https://example.com/file.pdf',
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

const noContent = (): MockResponse => ({ ok: true, status: 204, body: null });

const failure = (): MockResponse => ({
  ok: false,
  status: 500,
  body: { success: false, message: 'Internal server error' },
});

function notificationsRouter(list: NotificationRecipient[]) {
  return (url: string, method: string): MockResponse => {
    if (method === 'DELETE') return noContent();
    if (method === 'PUT' && url === '/notifications/read-all') return success(2);
    if (url === '/notifications/unread/count') {
      return success(list.filter((item) => !item.isRead).length);
    }
    if (url.startsWith('/notifications/')) {
      const notificationId = Number(url.split('/').pop());
      const item = list.find((n) => n.notificationId === notificationId);
      if (!item) return failure();
      return success({ ...item, isRead: true, readAt: '2026-08-17T10:00:00' });
    }
    if (url === '/notifications') return success(list);
    return failure();
  };
}

function renderNotifications(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('notifications page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the notification list with titles, unread badge and date', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(notificationsRouter([unread, read])));

    renderNotifications('/student/notifications');

    expect(await screen.findByText('Thông báo khai giảng')).toBeTruthy();
    expect(screen.getByText('Lịch nghỉ lễ')).toBeTruthy();
    expect(screen.getByText('Chưa đọc')).toBeTruthy();
    expect(screen.getAllByText(/16\/08\/2026/).length).toBeGreaterThanOrEqual(1);
  });

  it('shows an empty state when there are no notifications', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(notificationsRouter([])));

    renderNotifications('/student/notifications');

    expect(await screen.findByText('Không có thông báo nào')).toBeTruthy();
  });

  it('shows an error state and refetches when retrying', async () => {
    authStorage.setSession('jwt.student', studentUser);
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ success: false, message: 'Internal server error' }),
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    renderNotifications('/student/notifications');

    expect(await screen.findByText('Không thể tải thông báo')).toBeTruthy();

    vi.stubGlobal('fetch', createFetchMock(notificationsRouter([unread])));
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Thông báo khai giảng')).toBeTruthy();
  });

  it('opens the detail modal and marks an unread notification as read', async () => {
    authStorage.setSession('jwt.student', studentUser);
    const fetchMock = createFetchMock(notificationsRouter([unread, read]));
    vi.stubGlobal('fetch', fetchMock);

    renderNotifications('/student/notifications');
    fireEvent.click(await screen.findByText('Thông báo khai giảng'));

    const dialog = await screen.findByRole('dialog', { name: 'Thông báo khai giảng' });
    expect(within(dialog).getByText('Lớp IELTS 6.0 sẽ khai giảng vào tuần tới.')).toBeTruthy();
    await waitFor(() => {
      const detailCalls = fetchMock.mock.calls.filter(([input]) =>
        String(input).includes('/notifications/101'),
      );
      expect(detailCalls.length).toBeGreaterThanOrEqual(1);
    });
    await waitFor(() => {
      expect(screen.queryByText('Chưa đọc')).toBeNull();
    });
  });

  it('opens the detail modal for a read notification without marking it again', async () => {
    authStorage.setSession('jwt.student', studentUser);
    const fetchMock = createFetchMock(notificationsRouter([unread, read]));
    vi.stubGlobal('fetch', fetchMock);

    renderNotifications('/student/notifications');
    fireEvent.click(await screen.findByText('Lịch nghỉ lễ'));

    const dialog = await screen.findByRole('dialog', { name: 'Lịch nghỉ lễ' });
    expect(within(dialog).getByText('Trung tâm nghỉ lễ Quốc khánh 2/9.')).toBeTruthy();
    const detailCalls = fetchMock.mock.calls.filter(([input]) =>
      String(input).includes('/notifications/102'),
    );
    expect(detailCalls.length).toBe(0);
  });

  it('marks all notifications as read via the header action', async () => {
    authStorage.setSession('jwt.student', studentUser);
    const fetchMock = createFetchMock(notificationsRouter([unread, read]));
    vi.stubGlobal('fetch', fetchMock);

    renderNotifications('/student/notifications');
    const markAll = await screen.findByRole('button', { name: /Đánh dấu tất cả đã đọc/ });
    fireEvent.click(markAll);

    await waitFor(() => {
      const putCalls = fetchMock.mock.calls.filter(([, init]) => init?.method === 'PUT');
      expect(putCalls.length).toBeGreaterThanOrEqual(1);
    });
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Đánh dấu tất cả đã đọc/ })).toBeNull();
    });
    expect(screen.queryByText('Chưa đọc')).toBeNull();
  });

  it('hides the mark-all action when there are no unread notifications', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(notificationsRouter([read])));

    renderNotifications('/student/notifications');

    expect(await screen.findByText('Lịch nghỉ lễ')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Đánh dấu tất cả đã đọc/ })).toBeNull();
  });

  it('filters the list by unread status', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(notificationsRouter([unread, read])));

    renderNotifications('/student/notifications');
    await screen.findByText('Thông báo khai giảng');

    fireEvent.click(screen.getByRole('button', { name: 'Chưa đọc (1)' }));
    await waitFor(() => {
      expect(screen.queryByText('Lịch nghỉ lễ')).toBeNull();
    });
    expect(screen.getByText('Thông báo khai giảng')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Tất cả (2)' }));
    await waitFor(() => {
      expect(screen.getByText('Lịch nghỉ lễ')).toBeTruthy();
    });
  });

  it('deletes a notification after confirmation', async () => {
    authStorage.setSession('jwt.student', studentUser);
    const fetchMock = createFetchMock(notificationsRouter([unread, read]));
    vi.stubGlobal('fetch', fetchMock);

renderNotifications('/student/notifications');
    fireEvent.click(await screen.findByText('Thông báo khai giảng'));
    await screen.findByRole('dialog', { name: 'Thông báo khai giảng' });

    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }));
    expect(await screen.findByText('Xóa thông báo?')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận xóa' }));
    await waitFor(() => {
      const deleteCalls = fetchMock.mock.calls.filter(
        ([input, init]) =>
          init?.method === 'DELETE' && String(input).includes('/notifications/101'),
      );
      expect(deleteCalls.length).toBeGreaterThanOrEqual(1);
    });
    await waitFor(() => {
      expect(screen.queryByText('Thông báo khai giảng')).toBeNull();
    });
    expect(screen.queryByText('Xóa thông báo?')).toBeNull();
  });

  it('cancels the delete and keeps the notification', async () => {
    authStorage.setSession('jwt.student', studentUser);
    const fetchMock = createFetchMock(notificationsRouter([unread, read]));
    vi.stubGlobal('fetch', fetchMock);

    renderNotifications('/student/notifications');
    fireEvent.click(await screen.findByText('Thông báo khai giảng'));
    await screen.findByRole('dialog', { name: 'Thông báo khai giảng' });

    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Hủy' }));

    expect(screen.queryByText('Xóa thông báo?')).toBeNull();
    const deleteCalls = fetchMock.mock.calls.filter(([, init]) => init?.method === 'DELETE');
    expect(deleteCalls.length).toBe(0);
  });

  it('shows the full content and attachment link in the detail modal', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(notificationsRouter([unread, read])));

    renderNotifications('/student/notifications');
    fireEvent.click(await screen.findByText('Lịch nghỉ lễ'));

    const dialog = await screen.findByRole('dialog', { name: 'Lịch nghỉ lễ' });
    expect(within(dialog).getByText('Trung tâm nghỉ lễ Quốc khánh 2/9.')).toBeTruthy();
    const link = within(dialog).getByRole('link', { name: 'Tệp đính kèm' });
    expect(link.getAttribute('href')).toBe('https://example.com/file.pdf');
  });

  it('refreshes the header badge immediately when notifications change', async () => {
    authStorage.setSession('jwt.student', studentUser);
    let unreadCount = 1;
    const fetchMock = createFetchMock((url, method) => {
      if (url === '/notifications/unread/count') return success(unreadCount);
      return notificationsRouter([unread, read])(url, method);
    });
    vi.stubGlobal('fetch', fetchMock);

    renderNotifications('/student/notifications');
    await screen.findByText('Thông báo khai giảng');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Thông báo, 1 chưa đọc' })).toBeTruthy();
    });

    unreadCount = 0;
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Thông báo' })).toBeTruthy();
    });
  });
});