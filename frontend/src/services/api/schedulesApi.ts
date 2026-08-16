import { http } from '@/services/api/httpClient';
import type { Schedule } from '@/types/schedule';

export interface SchedulesQuery {
  from?: string;
  to?: string;
}

export const schedulesApi = {
  getSchedules: (query?: SchedulesQuery) => {
    const params = new URLSearchParams();
    if (query?.from) params.set('from', query.from);
    if (query?.to) params.set('to', query.to);
    const qs = params.toString();
    return http.get<Schedule[]>(`/schedules${qs ? `?${qs}` : ''}`);
  },
};
