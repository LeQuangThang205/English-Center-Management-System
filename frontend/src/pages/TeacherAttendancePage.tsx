import { useState } from 'react';
import { ListChecks } from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { todayLocal, useTeacherAttendance } from '@/features/attendance/useTeacherAttendance';
import { ApiError } from '@/services/api/httpClient';
import type { AttendanceStatus } from '@/types/attendance';
import styles from './TeacherAttendancePage.module.css';

const ATTENDANCE_STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'EXCUSED'];

const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: 'Có mặt',
  ABSENT: 'Vắng',
  EXCUSED: 'Vắng có phép',
};

const ATTENDANCE_STATUS_TONES: Record<AttendanceStatus, BadgeTone> = {
  PRESENT: 'success',
  ABSENT: 'danger',
  EXCUSED: 'warning',
};

function toSaveError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return 'Không có quyền thực hiện thao tác này.';
    if (error.status === 404) return 'Không tìm thấy phiếu điểm danh.';
    if (error.message) return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Không thể lưu điểm danh. Vui lòng thử lại.';
}

export function TeacherAttendancePage() {
  const {
    studyingClasses,
    classesStatus,
    classesError,
    reloadClasses,
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
  } = useTeacherAttendance();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const today = todayLocal();
  const isEditMode = existingSheet !== null;

  const handleSubmit = async () => {
    setSubmitError(null);
    setSuccessMessage(null);
    if (selectedClassId == null) {
      setSubmitError('Vui lòng chọn lớp học.');
      return;
    }
    if (selectedDate === '') {
      setSubmitError('Vui lòng chọn ngày điểm danh.');
      return;
    }
    // Backend chặn ngày tương lai; FE chặn trước để UX tốt hơn.
    if (selectedDate > today) {
      setSubmitError('Ngày điểm danh không được là ngày tương lai.');
      return;
    }
    if (roster.length === 0) {
      setSubmitError('Lớp hiện chưa có học viên đủ điều kiện điểm danh.');
      return;
    }
    try {
      const result = await save();
      if (result === 'created') {
        setSuccessMessage('Điểm danh thành công.');
      } else if (result === 'updated') {
        setSuccessMessage('Cập nhật điểm danh thành công.');
      } else {
        setSuccessMessage('Phiếu điểm danh đã tồn tại, đã tải bản mới nhất để sửa.');
      }
    } catch (error) {
      setSubmitError(toSaveError(error));
    }
  };

  return (
    <div className={styles.page}>
      <PageHeader title="Điểm danh" description="Điểm danh học viên trong lớp theo từng buổi học." />

      {classesStatus === 'loading' && <AttendanceSkeleton />}

      {classesStatus === 'error' && (
        <ErrorState
          icon={ListChecks}
          title="Không thể tải danh sách lớp học"
          message={classesError ?? undefined}
          onRetry={reloadClasses}
        />
      )}

      {classesStatus === 'success' &&
        (studyingClasses.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="Bạn chưa được phân công lớp đang học nào"
            description="Danh sách lớp đang học bạn phụ trách sẽ hiển thị tại đây."
          />
        ) : (
          <>
            <div className={styles.toolbar}>
              <div className={styles.classFilter}>
                <Select
                  aria-label="Chọn lớp học"
                  value={selectedClassId != null ? String(selectedClassId) : ''}
                  onChange={(event) =>
                    setSelectedClassId(event.target.value === '' ? null : Number(event.target.value))
                  }
                >
                  <option value="">Chọn lớp học</option>
                  {studyingClasses.map((cls) => (
                    <option key={cls.id} value={String(cls.id)}>
                      {cls.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className={styles.dateFilter}>
                <Input
                  type="date"
                  aria-label="Chọn ngày điểm danh"
                  value={selectedDate}
                  max={today}
                  onChange={(event) => setSelectedDate(event.target.value)}
                />
              </div>
              {isEditMode ? (
                <Badge tone="primary">Đã điểm danh — đang sửa</Badge>
              ) : (
                <Badge tone="neutral">Chưa điểm danh</Badge>
              )}
            </div>

            {selectedClassId == null ? (
              <EmptyState
                icon={ListChecks}
                title="Chưa chọn lớp học"
                description="Chọn một lớp học để bắt đầu điểm danh."
              />
            ) : (
              <>
                {dataStatus === 'loading' && <AttendanceSkeleton />}

                {dataStatus === 'error' && (
                  <ErrorState
                    icon={ListChecks}
                    title="Không thể tải danh sách điểm danh"
                    message={dataError ?? undefined}
                    onRetry={reload}
                  />
                )}

                {dataStatus === 'success' &&
                  (roster.length === 0 ? (
                    <EmptyState
                      icon={ListChecks}
                      title="Lớp hiện chưa có học viên đủ điều kiện điểm danh."
                      description="Chỉ học viên có đăng ký đã duyệt hoặc đã thanh toán mới được điểm danh."
                    />
                  ) : (
                    <Card>
                      <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th>Học viên</th>
                              <th>Trạng thái điểm danh</th>
                            </tr>
                          </thead>
                          <tbody>
                            {roster.map((row) => (
                              <tr key={row.studentId}>
                                <td>
                                  <span className={styles.studentName}>{row.studentName}</span>
                                </td>
                                <td>
                                  <div className={styles.statusCell}>
                                    <Badge
                                      tone={ATTENDANCE_STATUS_TONES[statuses[row.studentId] ?? 'PRESENT']}
                                      dot
                                    >
                                      {ATTENDANCE_STATUS_LABELS[statuses[row.studentId] ?? 'PRESENT']}
                                    </Badge>
                                    <Select
                                      aria-label={`Trạng thái điểm danh của ${row.studentName}`}
                                      value={statuses[row.studentId] ?? 'PRESENT'}
                                      onChange={(event) =>
                                        setRecordStatus(row.studentId, event.target.value as AttendanceStatus)
                                      }
                                    >
                                      {ATTENDANCE_STATUSES.map((item) => (
                                        <option key={item} value={item}>
                                          {ATTENDANCE_STATUS_LABELS[item]}
                                        </option>
                                      ))}
                                    </Select>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className={styles.actions}>
                        <Button variant="secondary" size="sm" onClick={markAllPresent} disabled={submitting}>
                          Tất cả có mặt
                        </Button>
                        <Button loading={submitting} onClick={() => void handleSubmit()}>
                          {isEditMode ? 'Cập nhật điểm danh' : 'Lưu điểm danh'}
                        </Button>
                      </div>
                      {submitError && (
                        <p className={styles.inlineError} role="alert">
                          {submitError}
                        </p>
                      )}
                      {successMessage && (
                        <p className={styles.successMessage} role="status">
                          {successMessage}
                        </p>
                      )}
                    </Card>
                  ))}
              </>
            )}
          </>
        ))}
    </div>
  );
}

function AttendanceSkeleton() {
  return (
    <div className={styles.skeletonList} aria-label="Đang tải danh sách điểm danh" role="status">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className={styles.skeletonRow} data-testid="skeleton-row">
          <span className={`${styles.skeletonLine} ${styles.skeletonLineName}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineStatus}`} />
        </div>
      ))}
    </div>
  );
}
