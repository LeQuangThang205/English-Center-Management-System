import { useCallback, useEffect, useState } from 'react';
import {
  buildAdminStats,
  buildStudentStats,
  buildTeacherStats,
  loadAdminDashboard,
  loadStudentDashboard,
  loadTeacherDashboard,
} from '@/features/dashboard/dashboardData';
import type {
  AdminDashboardData,
  DashboardData,
  DashboardStat,
  StudentDashboardData,
  TeacherDashboardData,
} from '@/features/dashboard/types';
import type { Role } from '@/types/user';

export type DashboardStatus = 'loading' | 'error' | 'success';

export interface UseDashboardDataResult {
  status: DashboardStatus;
  stats: DashboardStat[];
  data: DashboardData | null;
  reload: () => void;
}

export function useDashboardData(role: Role, userId: number): UseDashboardDataResult {
  const [status, setStatus] = useState<DashboardStatus>('loading');
  const [data, setData] = useState<DashboardData | null>(null);
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt((attemptNumber) => attemptNumber + 1), []);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setData(null);

    const load =
      role === 'ADMIN'
        ? loadAdminDashboard
        : role === 'TEACHER'
          ? () => loadTeacherDashboard(userId)
          : () => loadStudentDashboard(userId);

    load()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setStatus('success');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [role, userId, attempt]);

  const stats = data
    ? role === 'ADMIN'
      ? buildAdminStats(data as AdminDashboardData)
      : role === 'TEACHER'
        ? buildTeacherStats(data as TeacherDashboardData)
        : buildStudentStats(data as StudentDashboardData)
    : [];

  return { status, stats, data, reload };
}