import { useCallback, useEffect, useMemo, useState } from 'react';
import { notificationsApi } from '@/services/api/notificationsApi';
import { notifyNotificationsChanged } from '@/features/notifications/useUnreadNotifications';
import type { NotificationRecipient } from '@/types/notification';

export type NotificationsFilter = 'all' | 'unread';

export type LoadStatus = 'loading' | 'error' | 'success';

export interface UseNotificationsListResult {
  status: LoadStatus;
  /** Danh sách đã lọc theo `filter`. */
  items: NotificationRecipient[];
  filter: NotificationsFilter;
  setFilter: (filter: NotificationsFilter) => void;
  totalCount: number;
  unreadCount: number;
  reload: () => void;
  /** Đánh dấu đã đọc qua GET /{id} (backend auto-read). Trả false nếu API thất bại. */
  markAsRead: (notificationId: number) => Promise<boolean>;
  /** Đánh dấu tất cả đã đọc. Trả false nếu API thất bại. */
  markAllAsRead: () => Promise<boolean>;
  /** Xóa thông báo. Trả false nếu API thất bại. */
  remove: (notificationId: number) => Promise<boolean>;
}

export function useNotificationsList(): UseNotificationsListResult {
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [items, setItems] = useState<NotificationRecipient[]>([]);
  const [filter, setFilter] = useState<NotificationsFilter>('all');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setStatus('loading');
      try {
        const list = await notificationsApi.getAll();
        if (cancelled) return;
        setItems(list);
        setStatus('success');
      } catch {
        if (!cancelled) {
          setStatus('error');
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const totalCount = items.length;
  const unreadCount = useMemo(() => items.filter((item) => !item.isRead).length, [items]);

  const markAsRead = useCallback(async (notificationId: number): Promise<boolean> => {
    try {
      const updated = await notificationsApi.getById(notificationId);
      setItems((prev) =>
        prev.map((item) => (item.notificationId === notificationId ? updated : item)),
      );
      notifyNotificationsChanged();
      return true;
    } catch {
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      await notificationsApi.markAllAsRead();
      setItems((prev) =>
        prev.map((item) =>
          item.isRead ? item : { ...item, isRead: true, readAt: new Date().toISOString() },
        ),
      );
      notifyNotificationsChanged();
      return true;
    } catch {
      return false;
    }
  }, []);

  const remove = useCallback(async (notificationId: number): Promise<boolean> => {
    try {
      await notificationsApi.remove(notificationId);
      setItems((prev) => prev.filter((item) => item.notificationId !== notificationId));
      notifyNotificationsChanged();
      return true;
    } catch {
      return false;
    }
  }, []);

  const reload = useCallback(() => {
    setReloadKey((value) => value + 1);
  }, []);

  const visibleItems =
    filter === 'all' ? items : items.filter((item) => !item.isRead);

  return {
    status,
    items: visibleItems,
    filter,
    setFilter,
    totalCount,
    unreadCount,
    reload,
    markAsRead,
    markAllAsRead,
    remove,
  };
}