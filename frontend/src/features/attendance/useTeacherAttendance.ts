import { useCallback, useEffect, useMemo, useState } from 'react';
import { attendanceApi } from '@/services/api/attendanceApi';
import { classesApi } from '@/services/api/classesApi';
import { registrationsApi } from '@/services/api/registrationsApi';
import { useAuth } from '@/features/auth/useAuth';
import { ApiError } from '@/services/api/httpClient';
import type { AttendanceSheet, AttendanceStatus } from '@/types/attendance';
import type { CourseClass } from '@/types/courseClass';

export interface RosterRow {
  studentId: number;
  studentName: string;
}

type PageStatus = 'loading' | 'error' | 'success';

export function todayLocal(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function useTeacherAttendance() {
  const { user } = useAuth();
  const teacherId = user?.id;

  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [classesStatus, setClassesStatus] = useState<PageStatus>('loading');
  const [classesError, setClassesError] = useState<string | null>(null);

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(todayLocal());

  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [existingSheet, setExistingSheet] = useState<AttendanceSheet | null>(null);
  const [statuses, setStatuses] = useState<Record<number, AttendanceStatus>>({});
  const [dataStatus, setDataStatus] = useState<PageStatus>('loading');
  const [dataError, setDataError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const loadClasses = useCallback(async () => {
    if (!teacherId) {
      setClassesStatus('error');
      setClassesError('Không xác định được giáo viên. Vui lòng đăng nhập lại.');
      return;
    }
    setClassesStatus('loading');
    setClassesError(null);
    try {
      // Backend GET /classes là XOR (courseId > teacherId > status) nên chỉ
      // truyền teacherId, lọc STUDYING ở client.
      const data = await classesApi.getClasses({ teacherId });
      setClasses(data);
      setClassesStatus('success');
    } catch {
      setClassesStatus('error');
      setClassesError('Không thể tải danh sách lớp học. Vui lòng thử lại.');
    }
  }, [teacherId]);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  // Backend không hỗ trợ lọc teacherId + status cùng lúc nên lọc ở client.
  const studyingClasses = useMemo(() => classes.filter((cls) => cls.status === 'STUDYING'), [classes]);

  useEffect(() => {
    if (selectedClassId == null && studyingClasses.length > 0) {
      setSelectedClassId(studyingClasses[0].id);
    }
  }, [selectedClassId, studyingClasses]);

  const loadData = useCallback(async (classId: number, date: string) => {
    setDataStatus('loading');
    setDataError(null);
    try {
      const [registrations, sheets] = await Promise.all([
        // GET /registrations?classId trả mọi registration của lớp (XOR hợp lệ
        // với classId-only); lọc APPROVED/PAID ở client đúng enrolledStudentIds backend.
        registrationsApi.getRegistrations({ classId }),
        // GET /sheets hỗ trợ kết hợp classId + date (date lọc in-memory).
        attendanceApi.getSheets({ classId, date }),
      ]);
      const eligible = registrations.filter(
        (r) => r.status === 'APPROVED' || r.status === 'PAID',
      );
      const rows: RosterRow[] = eligible.map((r) => ({
        studentId: r.studentId,
        studentName: r.studentName,
      }));
      const sheet = sheets.length > 0 ? sheets[0] : null;
      const byStudent = new Map((sheet?.records ?? []).map((record) => [record.studentId, record.status]));
      const nextStatuses: Record<number, AttendanceStatus> = {};
      for (const row of rows) {
        nextStatuses[row.studentId] = byStudent.get(row.studentId) ?? 'PRESENT';
      }
      setRoster(rows);
      setExistingSheet(sheet);
      setStatuses(nextStatuses);
      setDataStatus('success');
    } catch {
      setDataStatus('error');
      setDataError('Không thể tải danh sách điểm danh. Vui lòng thử lại.');
    }
  }, []);

  useEffect(() => {
    if (selectedClassId != null && selectedDate !== '') {
      void loadData(selectedClassId, selectedDate);
    }
  }, [loadData, selectedClassId, selectedDate]);

  const reload = useCallback(() => {
    if (selectedClassId != null && selectedDate !== '') {
      void loadData(selectedClassId, selectedDate);
    }
  }, [loadData, selectedClassId, selectedDate]);

  const setRecordStatus = useCallback((studentId: number, status: AttendanceStatus) => {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
  }, []);

  const markAllPresent = useCallback(() => {
    setStatuses((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[Number(key)] = 'PRESENT';
      }
      return next;
    });
  }, []);

  /**
   * Lưu phiếu. Giả định FE đã validate class/date/roster.
   * Trả về 'created' | 'updated' | 'recovered' (duplicate → đã refetch sang edit mode).
   * Ném ApiError cho các lỗi khác.
   */
  const save = useCallback(async (): Promise<'created' | 'updated' | 'recovered'> => {
    if (selectedClassId == null || selectedDate === '') {
      throw new Error('Vui lòng chọn lớp và ngày điểm danh.');
    }
    const records = roster.map((row) => ({
      studentId: row.studentId,
      status: statuses[row.studentId] ?? 'PRESENT',
    }));
    setSubmitting(true);
    try {
      if (existingSheet) {
        // Update thay thế toàn bộ records, không gửi classId/date.
        await attendanceApi.updateAttendanceSheet(existingSheet.id, { records });
        await loadData(selectedClassId, selectedDate);
        return 'updated';
      }
      try {
        await attendanceApi.createAttendanceSheet({
          classId: selectedClassId,
          date: selectedDate,
          records,
        });
      } catch (error) {
        // Race: sheet đã được tạo giữa chừng → refetch, chuyển edit mode, không tạo lại.
        if (
          error instanceof ApiError &&
          error.status === 400 &&
          /already exists/i.test(error.message)
        ) {
          await loadData(selectedClassId, selectedDate);
          return 'recovered';
        }
        throw error;
      }
      await loadData(selectedClassId, selectedDate);
      return 'created';
    } finally {
      setSubmitting(false);
    }
  }, [existingSheet, loadData, roster, selectedClassId, selectedDate, statuses]);

  return {
    teacherId,
    classes,
    studyingClasses,
    classesStatus,
    classesError,
    reloadClasses: loadClasses,
    selectedClassId,
    setSelectedClassId,
    selectedDate,
    setSelectedDate,
    roster,
    existingSheet,
    statuses,
    setRecordStatus,
    markAllPresent,
    dataStatus,
    dataError,
    reload,
    submitting,
    save,
  };
}
