import { useCallback, useEffect, useState } from 'react';
import { schedulesApi, type SchedulesQuery } from '@/services/api/schedulesApi';
import { useAuth } from '@/features/auth/useAuth';
import type { Schedule } from '@/types/schedule';

type ScheduleStatus = 'loading' | 'error' | 'success';

export function useTeacherSchedule() {
  const { user } = useAuth();
  const teacherId = user?.id;

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [status, setStatus] = useState<ScheduleStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [to, setTo] = useState<string>(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 6);
    return nextWeek.toISOString().split('T')[0];
  });

  const load = useCallback(async () => {
    if (!teacherId) {
      setStatus('error');
      setError('Không xác định được giáo viên. Vui lòng đăng nhập lại.');
      return;
    }
    setStatus('loading');
    setError(null);
    try {
      const query: SchedulesQuery = { from, to };
      const data = await schedulesApi.getSchedules(query);
      setSchedules(data);
      setStatus('success');
    } catch {
      setStatus('error');
      setError('Không thể tải lịch dạy. Vui lòng thử lại.');
    }
  }, [teacherId, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  return { schedules, status, error, reload: load, from, to, setFrom, setTo };
}