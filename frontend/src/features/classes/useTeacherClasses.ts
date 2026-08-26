import { useCallback, useEffect, useState } from 'react';
import { classesApi, type ClassesQuery } from '@/services/api/classesApi';
import { useAuth } from '@/features/auth/useAuth';
import type { CourseClass } from '@/types/courseClass';

type ClassesStatus = 'loading' | 'error' | 'success';

export function useTeacherClasses() {
  const { user } = useAuth();
  const teacherId = user?.id;

  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [status, setStatus] = useState<ClassesStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!teacherId) {
      setStatus('error');
      setError('Không xác định được giáo viên. Vui lòng đăng nhập lại.');
      return;
    }
    setStatus('loading');
    setError(null);
    try {
      const query: ClassesQuery = { teacherId };
      const data = await classesApi.getClasses(query);
      setClasses(data);
      setStatus('success');
    } catch {
      setStatus('error');
      setError('Không thể tải danh sách lớp học. Vui lòng thử lại.');
    }
  }, [teacherId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { classes, status, error, reload: load };
}