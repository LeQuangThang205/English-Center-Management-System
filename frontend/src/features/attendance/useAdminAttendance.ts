import { useCallback, useEffect, useState } from 'react';
import { attendanceApi } from '@/services/api/attendanceApi';
import { classesApi } from '@/services/api/classesApi';
import type { AttendanceSheet } from '@/types/attendance';
import type { CourseClass } from '@/types/courseClass';

type AttendanceStatus = 'loading' | 'error' | 'success';

export function useAdminAttendance() {
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [sheets, setSheets] = useState<AttendanceSheet[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSheetId, setSelectedSheetId] = useState<number | null>(null);
  const [status, setStatus] = useState<AttendanceStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const loadSheets = useCallback(async (classId: number | null, date: string) => {
    setStatus('loading');
    setError(null);
    try {
      const query =
        classId != null || date !== ''
          ? {
              ...(classId != null ? { classId } : {}),
              ...(date !== '' ? { date } : {}),
            }
          : undefined;
      const [classList, sheetList] = await Promise.all([
        classesApi.getClasses(),
        attendanceApi.getSheets(query),
      ]);
      setClasses(classList);
      setSheets(sheetList);
      setStatus('success');
    } catch {
      setStatus('error');
      setError('Không thể tải phiếu điểm danh. Vui lòng thử lại.');
    }
  }, []);

  useEffect(() => {
    void loadSheets(selectedClassId, selectedDate);
  }, [loadSheets, selectedClassId, selectedDate]);

  const reload = useCallback(() => {
    void loadSheets(selectedClassId, selectedDate);
  }, [loadSheets, selectedClassId, selectedDate]);

  const clearFilters = useCallback(() => {
    setSelectedClassId(null);
    setSelectedDate('');
  }, []);

  const selectedSheet: AttendanceSheet | null =
    selectedSheetId != null ? (sheets.find((sheet) => sheet.id === selectedSheetId) ?? null) : null;

  const openDetail = useCallback((id: number) => {
    setSelectedSheetId(id);
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedSheetId(null);
  }, []);

  return {
    classes,
    sheets,
    selectedClassId,
    setSelectedClassId,
    selectedDate,
    setSelectedDate,
    selectedSheet,
    selectedSheetId,
    openDetail,
    closeDetail,
    clearFilters,
    status,
    error,
    reload,
  };
}
