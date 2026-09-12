import { useCallback, useEffect, useMemo, useState } from 'react';
import { classesApi, type ClassPayload } from '@/services/api/classesApi';
import { coursesApi } from '@/services/api/coursesApi';
import { usersApi } from '@/services/api/usersApi';
import type { Course } from '@/types/course';
import type { ClassStatus, CourseClass } from '@/types/courseClass';
import type { User } from '@/types/user';

export type ClassStatusFilter = 'ALL' | ClassStatus;
export type ClassCourseFilter = 'ALL' | string;

type ClassesStatus = 'loading' | 'error' | 'success';

export function useAdminClasses() {
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClassStatusFilter>('ALL');
  const [courseFilter, setCourseFilter] = useState<ClassCourseFilter>('ALL');
  const [status, setStatus] = useState<ClassesStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const [classesData, coursesData, teachersData] = await Promise.all([
        classesApi.getClasses(),
        coursesApi.getCourses(),
        usersApi.getUsers({ role: 'TEACHER' }),
      ]);
      setClasses(classesData);
      setCourses(coursesData);
      setTeachers(teachersData);
      setStatus('success');
    } catch {
      setStatus('error');
      setError('Không thể tải danh sách lớp học. Vui lòng thử lại.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // FE guard: dropdown khóa học chỉ offer course ACTIVE.
  // Backend không enforce rule này — đây là quyết định hiển thị của FE.
  const activeCourses = useMemo(() => courses.filter((course) => course.status === 'ACTIVE'), [courses]);

  const visibleClasses = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return classes.filter((cls) => {
      if (statusFilter !== 'ALL' && cls.status !== statusFilter) return false;
      if (courseFilter !== 'ALL' && String(cls.courseId) !== courseFilter) return false;
      if (!keyword) return true;
      const haystack = `${cls.name} ${cls.courseName} ${cls.teacherName ?? ''} ${cls.room}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [classes, search, statusFilter, courseFilter]);

  const createClass = useCallback(
    async (payload: ClassPayload) => {
      await classesApi.createClass(payload);
      await load();
    },
    [load],
  );

  const updateClass = useCallback(
    async (id: number, payload: ClassPayload) => {
      await classesApi.updateClass(id, payload);
      await load();
    },
    [load],
  );

  const cancelClass = useCallback(
    async (id: number) => {
      await classesApi.deleteClass(id);
      await load();
    },
    [load],
  );

  return {
    classes,
    visibleClasses,
    activeCourses,
    teachers,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    courseFilter,
    setCourseFilter,
    status,
    error,
    reload: load,
    createClass,
    updateClass,
    cancelClass,
  };
}
