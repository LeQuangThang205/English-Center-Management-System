import { useEffect, useState } from 'react';
import { notificationsApi } from '@/services/api/notificationsApi';

export const UNREAD_POLL_INTERVAL_MS = 60_000;

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

    setLoading(true);
    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, UNREAD_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [enabled]);

  return { count, loading };
}
