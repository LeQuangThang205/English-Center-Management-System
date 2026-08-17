import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AppShell } from '@/components/layout/AppShell';
import { authStorage } from '@/features/auth/authStorage';
import { UNREAD_POLL_INTERVAL_MS } from '@/features/notifications/useUnreadNotifications';
import type { Role, User } from '@/types/user';

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

function mockUnreadCount(count: number) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data: count }),
    }),
  );
}

function mockUnreadCountFailure() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ success: false, message: 'Internal server error' }),
    }),
  );
}

function renderShell(role: Role, preview = false) {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AppShell role={role} preview={preview}>
          <div>main content</div>
        </AppShell>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('notification badge in header', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('shows the unread count on the bell button when there are unread notifications', async () => {
    authStorage.setSession('jwt.teacher', makeUser('TEACHER', 'teacher1@example.com'));
    mockUnreadCount(3);

    renderShell('TEACHER');

    await waitFor(() => {
      expect(screen.getByText('3')).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: 'Thông báo, 3 chưa đọc' })).toBeTruthy();
  });

  it('hides the badge when the unread count is zero', async () => {
    authStorage.setSession('jwt.student', makeUser('STUDENT', 'student1@example.com'));
    mockUnreadCount(0);

    renderShell('STUDENT');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Thông báo' })).toBeTruthy();
    });
    expect(screen.queryByText('0')).toBeNull();
  });

  it('does not fetch the count when not authenticated', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    renderShell('ADMIN');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Thông báo' })).toBeTruthy();
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not fetch the count in preview mode', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    renderShell('ADMIN', true);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Thông báo' })).toBeTruthy();
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refreshes the count on each poll tick', async () => {
    vi.useFakeTimers();
    authStorage.setSession('jwt.teacher', makeUser('TEACHER', 'teacher1@example.com'));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: 2 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: 5 }),
      });
    vi.stubGlobal('fetch', fetchMock);

    renderShell('TEACHER');

    await vi.advanceTimersByTimeAsync(0);
    expect(screen.getByText('2')).toBeTruthy();

    await vi.advanceTimersByTimeAsync(UNREAD_POLL_INTERVAL_MS);
    await vi.advanceTimersByTimeAsync(0);
    expect(screen.getByText('5')).toBeTruthy();
    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('clears the poll interval and does not update after unmount', async () => {
    vi.useFakeTimers();
    authStorage.setSession('jwt.student', makeUser('STUDENT', 'student1@example.com'));
    mockUnreadCount(1);

    const { unmount } = renderShell('STUDENT');

    await vi.advanceTimersByTimeAsync(0);
    expect(screen.getByText('1')).toBeTruthy();

    unmount();
    await vi.advanceTimersByTimeAsync(UNREAD_POLL_INTERVAL_MS * 2);
  });

  it('hides the badge and does not crash when the count request fails', async () => {
    authStorage.setSession('jwt.teacher', makeUser('TEACHER', 'teacher1@example.com'));
    mockUnreadCountFailure();

    renderShell('TEACHER');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Thông báo' })).toBeTruthy();
    });
    expect(screen.queryByText(/\d+/)).toBeNull();
  });

  it('hides the badge when a later poll fails after showing the count', async () => {
    vi.useFakeTimers();
    authStorage.setSession('jwt.teacher', makeUser('TEACHER', 'teacher1@example.com'));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: 3 }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ success: false, message: 'Internal server error' }),
      });
    vi.stubGlobal('fetch', fetchMock);

    renderShell('TEACHER');

    await vi.advanceTimersByTimeAsync(0);
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Thông báo, 3 chưa đọc' })).toBeTruthy();

    await vi.advanceTimersByTimeAsync(UNREAD_POLL_INTERVAL_MS);
    await vi.advanceTimersByTimeAsync(0);
    expect(screen.queryByText('3')).toBeNull();
    expect(screen.getByRole('button', { name: 'Thông báo' })).toBeTruthy();
  });

  it('caps the displayed count at 99+', async () => {
    authStorage.setSession('jwt.student', makeUser('STUDENT', 'student1@example.com'));
    mockUnreadCount(120);

    renderShell('STUDENT');

    await waitFor(() => {
      expect(screen.getByText('99+')).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: 'Thông báo, 120 chưa đọc' })).toBeTruthy();
  });
});