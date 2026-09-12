import { useCallback, useEffect, useState } from 'react';
import { registrationsApi } from '@/services/api/registrationsApi';
import { useAuth } from '@/features/auth/useAuth';
import type { Registration } from '@/types/registration';

type CoursesStatus = 'loading' | 'error' | 'success';

export function useStudentCourses() {
  const { user } = useAuth();
  const studentId = user?.id;

  const [courses, setCourses] = useState<Registration[]>([]);
  const [status, setStatus] = useState<CoursesStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!studentId) {
      setStatus('error');
      setError('Không xác định được học viên. Vui lòng đăng nhập lại.');
      return;
    }
    setStatus('loading');
    setError(null);
    try {
      const data = await registrationsApi.getRegistrations({ studentId });
      setCourses(
        data.filter(
          (registration) =>
            registration.status === 'APPROVED' || registration.status === 'PAID',
        ),
      );
      setStatus('success');
    } catch {
      setStatus('error');
      setError('Không thể tải danh sách khóa học. Vui lòng thử lại.');
    }
  }, [studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { courses, status, error, reload: load };
}
