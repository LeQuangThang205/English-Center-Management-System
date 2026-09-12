import { useCallback, useEffect, useMemo, useState } from 'react';
import { usersApi, type UserPayload } from '@/services/api/usersApi';
import type { User, UserStatus } from '@/types/user';

export type StudentStatusFilter = 'ALL' | UserStatus;

type StudentsStatus = 'loading' | 'error' | 'success';

export function useAdminStudents() {
  const [students, setStudents] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StudentStatusFilter>('ALL');
  const [status, setStatus] = useState<StudentsStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await usersApi.getUsers({ role: 'STUDENT' });
      setStudents(data);
      setStatus('success');
    } catch {
      setStatus('error');
      setError('Không thể tải danh sách học viên. Vui lòng thử lại.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleStudents = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return students.filter((student) => {
      if (statusFilter !== 'ALL' && student.status !== statusFilter) return false;
      if (!keyword) return true;
      return (
        student.fullName.toLowerCase().includes(keyword) ||
        student.email.toLowerCase().includes(keyword)
      );
    });
  }, [students, search, statusFilter]);

  const updateStudent = useCallback(async (id: number, payload: UserPayload) => {
    await usersApi.updateUser(id, payload);
    await load();
  }, [load]);

  const deactivateStudent = useCallback(
    async (id: number) => {
      await usersApi.deleteUser(id);
      await load();
    },
    [load],
  );

  const reactivateStudent = useCallback(
    async (student: User) => {
      await usersApi.updateUser(student.id, {
        email: student.email,
        fullName: student.fullName,
        phone: student.phone ?? null,
        role: 'STUDENT',
        status: 'ACTIVE',
        avatarUrl: student.avatarUrl ?? null,
      });
      await load();
    },
    [load],
  );

  return {
    students,
    visibleStudents,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    status,
    error,
    reload: load,
    updateStudent,
    deactivateStudent,
    reactivateStudent,
  };
}
