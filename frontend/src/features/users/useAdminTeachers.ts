import { useCallback, useEffect, useMemo, useState } from 'react';
import { usersApi, type UserPayload } from '@/services/api/usersApi';
import type { User, UserStatus } from '@/types/user';

export type TeacherStatusFilter = 'ALL' | UserStatus;

type TeachersStatus = 'loading' | 'error' | 'success';

export function useAdminTeachers() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TeacherStatusFilter>('ALL');
  const [status, setStatus] = useState<TeachersStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await usersApi.getUsers({ role: 'TEACHER' });
      setTeachers(data);
      setStatus('success');
    } catch {
      setStatus('error');
      setError('Không thể tải danh sách giáo viên. Vui lòng thử lại.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleTeachers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return teachers.filter((teacher) => {
      if (statusFilter !== 'ALL' && teacher.status !== statusFilter) return false;
      if (!keyword) return true;
      return (
        teacher.fullName.toLowerCase().includes(keyword) ||
        teacher.email.toLowerCase().includes(keyword)
      );
    });
  }, [teachers, search, statusFilter]);

  const updateTeacher = useCallback(async (id: number, payload: UserPayload) => {
    await usersApi.updateUser(id, payload);
    await load();
  }, [load]);

  const deactivateTeacher = useCallback(
    async (id: number) => {
      await usersApi.deleteUser(id);
      await load();
    },
    [load],
  );

  const reactivateTeacher = useCallback(
    async (teacher: User) => {
      await usersApi.updateUser(teacher.id, {
        email: teacher.email,
        fullName: teacher.fullName,
        phone: teacher.phone ?? null,
        role: 'TEACHER',
        status: 'ACTIVE',
        avatarUrl: teacher.avatarUrl ?? null,
      });
      await load();
    },
    [load],
  );

  return {
    teachers,
    visibleTeachers,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    status,
    error,
    reload: load,
    updateTeacher,
    deactivateTeacher,
    reactivateTeacher,
  };
}
