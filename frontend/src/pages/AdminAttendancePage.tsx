import { CalendarCheck } from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { useAdminAttendance } from '@/features/attendance/useAdminAttendance';
import type { AttendanceSheet, AttendanceStatus } from '@/types/attendance';
import { formatDateTime } from '@/utils/format';
import styles from './AdminAttendancePage.module.css';

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: 'Có mặt',
  ABSENT: 'Vắng',
  EXCUSED: 'Phép',
};

const STATUS_TONES: Record<AttendanceStatus, BadgeTone> = {
  PRESENT: 'success',
  ABSENT: 'danger',
  EXCUSED: 'warning',
};

interface SheetCounts {
  present: number;
  absent: number;
  excused: number;
  total: number;
}

function countSheet(sheet: AttendanceSheet): SheetCounts {
  const records = sheet.records ?? [];
  let present = 0;
  let absent = 0;
  let excused = 0;
  for (const record of records) {
    if (record.status === 'PRESENT') present += 1;
    else if (record.status === 'ABSENT') absent += 1;
    else if (record.status === 'EXCUSED') excused += 1;
  }
  return { present, absent, excused, total: records.length };
}

export function AdminAttendancePage() {
  const {
    classes,
    sheets,
    selectedClassId,
    setSelectedClassId,
    selectedDate,
    setSelectedDate,
    selectedSheet,
    openDetail,
    closeDetail,
    clearFilters,
    status,
    error,
    reload,
  } = useAdminAttendance();

  const sheetsList = sheets ?? [];
  const isFiltered = selectedClassId != null || selectedDate !== '';

  return (
    <div className={styles.page}>
      <PageHeader title="Điểm danh" description="Xem phiếu điểm danh trên toàn hệ thống." />

      {status === 'success' && (
        <div className={styles.toolbar}>
          <div className={styles.classSelect}>
            <Select
              aria-label="Lọc theo lớp học"
              value={selectedClassId != null ? String(selectedClassId) : ''}
              onChange={(e) => {
                setSelectedClassId(e.target.value === '' ? null : Number(e.target.value));
              }}
            >
              <option value="">Tất cả các lớp</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} — {cls.courseName}
                </option>
              ))}
            </Select>
          </div>
          <div className={styles.dateFilter}>
            <Input
              type="date"
              aria-label="Lọc theo ngày"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
              }}
            />
          </div>
          {isFiltered && (
            <Button type="button" variant="secondary" size="sm" onClick={clearFilters}>
              Xóa lọc
            </Button>
          )}
        </div>
      )}

      {status === 'loading' && <AdminAttendanceSkeleton />}

      {status === 'error' && (
        <ErrorState
          icon={CalendarCheck}
          title="Không thể tải phiếu điểm danh"
          message={error ?? undefined}
          onRetry={reload}
        />
      )}

      {status === 'success' &&
        (sheetsList.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title={isFiltered ? 'Không tìm thấy phiếu điểm danh' : 'Chưa có phiếu điểm danh nào'}
            description={
              isFiltered
                ? 'Thử thay đổi bộ lọc lớp học hoặc ngày.'
                : 'Chưa có phiếu điểm danh nào trong hệ thống.'
            }
          />
        ) : (
          <Card>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Lớp</th>
                    <th>Khóa học</th>
                    <th className={styles.numberCol}>Có mặt</th>
                    <th className={styles.numberCol}>Vắng</th>
                    <th className={styles.numberCol}>Phép</th>
                    <th className={styles.numberCol}>Tổng</th>
                    <th>Người tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {sheetsList.map((sheet) => {
                    const counts = countSheet(sheet);
                    return (
                      <tr key={sheet.id}>
                        <td className={styles.dateCell}>{formatDateTime(sheet.date)}</td>
                        <td>
                          <span className={styles.className}>{sheet.className || '—'}</span>
                        </td>
                        <td>{sheet.courseName || '—'}</td>
                        <td className={styles.numberCol}>{counts.present}</td>
                        <td className={styles.numberCol}>{counts.absent}</td>
                        <td className={styles.numberCol}>{counts.excused}</td>
                        <td className={styles.numberCol}>{counts.total}</td>
                        <td>{sheet.createdByName || '—'}</td>
                        <td>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetail(sheet.id)}
                          >
                            Xem
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ))}

      <Modal
        open={selectedSheet != null}
        size="lg"
        title={
          selectedSheet ? `${selectedSheet.className || 'Phiếu điểm danh'} — ${formatDateTime(selectedSheet.date)}` : undefined
        }
        onClose={closeDetail}
      >
        {selectedSheet != null &&
          (() => {
            const records = selectedSheet.records ?? [];
            if (records.length === 0) {
              return (
                <EmptyState
                  icon={CalendarCheck}
                  title="Phiếu chưa có điểm danh"
                  description="Phiếu này chưa ghi nhận học viên nào."
                />
              );
            }
            return (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Học viên</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id}>
                        <td>
                          <span className={styles.studentName}>{record.studentName}</span>
                        </td>
                        <td>
                          <Badge tone={STATUS_TONES[record.status]} dot>
                            {STATUS_LABELS[record.status]}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
      </Modal>
    </div>
  );
}

function AdminAttendanceSkeleton() {
  return (
    <div className={styles.skeletonList} aria-label="Đang tải phiếu điểm danh" role="status">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className={styles.skeletonRow} data-testid="skeleton-row">
          <span className={`${styles.skeletonLine} ${styles.skeletonLineDate}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineClass}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineCourse}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineCount}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineCount}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineCount}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineCount}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineCreator}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineAction}`} />
        </div>
      ))}
    </div>
  );
}
