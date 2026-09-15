import { useCallback, useEffect, useMemo, useState } from 'react';
import { classesApi } from '@/services/api/classesApi';
import { registrationsApi } from '@/services/api/registrationsApi';
import type { CourseClass } from '@/types/courseClass';
import type { Registration, RegistrationStatus } from '@/types/registration';

export type RegistrationStatusFilter = 'ALL' | RegistrationStatus;
export type RegistrationClassFilter = 'ALL' | string;

type RegistrationsStatus = 'loading' | 'error' | 'success';

export function useAdminRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RegistrationStatusFilter>('PENDING');
  const [classFilter, setClassFilter] = useState<RegistrationClassFilter>('ALL');
  const [status, setStatus] = useState<RegistrationsStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      // Backend findAll chỉ áp dụng đúng 1 filter query (ưu tiên
      // studentId > classId > status) nên S08 load toàn bộ một lần
      // và kết hợp status/class/search hoàn toàn ở client-side.
      const [registrationsData, classesData] = await Promise.all([
        registrationsApi.getRegistrations(),
        classesApi.getClasses(),
      ]);
      setRegistrations(registrationsData);
      setClasses(classesData);
      setStatus('success');
    } catch {
      setStatus('error');
      setError('Không thể tải danh sách đăng ký. Vui lòng thử lại.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleRegistrations = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return registrations.filter((registration) => {
      if (statusFilter !== 'ALL' && registration.status !== statusFilter) return false;
      if (classFilter !== 'ALL' && String(registration.classId) !== classFilter) return false;
      if (!keyword) return true;
      const haystack =
        `${registration.studentName} ${registration.className} ${registration.courseName}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [registrations, search, statusFilter, classFilter]);

  // currentHeadcount do backend sở hữu (tăng khi approve, giảm khi
  // cancel từ APPROVED). FE không tự tính — luôn reload server state.
  const approveRegistration = useCallback(
    async (id: number) => {
      await registrationsApi.approveRegistration(id);
      await load();
    },
    [load],
  );

  const rejectRegistration = useCallback(
    async (id: number, reason: string) => {
      await registrationsApi.rejectRegistration(id, reason);
      await load();
    },
    [load],
  );

  const cancelRegistration = useCallback(
    async (id: number) => {
      await registrationsApi.cancelRegistration(id);
      await load();
    },
    [load],
  );

  const markPaidRegistration = useCallback(
    async (id: number) => {
      await registrationsApi.markPaidRegistration(id);
      await load();
    },
    [load],
  );

  return {
    registrations,
    visibleRegistrations,
    classes,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    classFilter,
    setClassFilter,
    status,
    error,
    reload: load,
    approveRegistration,
    rejectRegistration,
    cancelRegistration,
    markPaidRegistration,
  };
}
