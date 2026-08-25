import { useEffect, useState } from 'react';
import { notificationsApi } from '@/services/api/notificationsApi';

export const UNREAD_POLL_INTERVAL_MS = 60_000;

/** Sự kiện phát ra khi danh sách thông báo thay đổi (mark-read / read-all / delete) — badge refresh ngay. */
export const NOTIFICATIONS_CHANGED_EVENT = 'ecms:notifications-changed';

export function notifyNotificationsChanged(): void {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}

export interface UseUnreadNotificationsResult {
  count: number;
  loading: boolean;
}

export function useUnreadNotifications(enabled: boolean): UseUnreadNotificationsResult {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const refresh = async () => {
      try {
        const next = await notificationsApi.getUnreadCount();
        if (cancelled) return;
        setCount(next);
      } catch {
        // Lỗi API (mạng, 5xx, session hết hạn...) → ẩn badge, không crash.
        if (!cancelled) {
          setCount(0);
        }
      }
      if (!cancelled) {
        setLoading(false);
      }
    };

    const handleChanged = () => {
      void refresh();
    };

    setLoading(true);
    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, UNREAD_POLL_INTERVAL_MS);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, handleChanged);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, handleChanged);
    };
  }, [enabled]);

  return { count, loading };
}
