import { useMemo, useState } from 'react';
import { CalendarClock, Filter, ListChecks } from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/ui/Badge';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { useTeacherClasses } from '@/features/classes/useTeacherClasses';
import type { ClassStatus } from '@/types/courseClass';
import { formatDateTime } from '@/utils/format';
import styles from './TeacherClassesPage.module.css';

const CLASS_STATUS_LABELS: Record<ClassStatus, string> = {
  UPCOMING: 'Sắp khai giảng',
  STUDYING: 'Đang học',
  FINISHED: 'Đã kết thúc',
  CANCELLED: 'Đã hủy',
};

const CLASS_STATUS_TONES: Record<ClassStatus, BadgeTone> = {
  UPCOMING: 'warning',
  STUDYING: 'primary',
  FINISHED: 'success',
  CANCELLED: 'danger',
};

const SCHEDULE_DAY_LABELS: Record<string, string> = {
  MON: 'Thứ 2',
  TUE: 'Thứ 3',
  WED: 'Thứ 4',
  THU: 'Thứ 5',
  FRI: 'Thứ 6',
  SAT: 'Thứ 7',
  SUN: 'Chủ nhật',
};

function formatSchedule(day: string, startTime: string, endTime: string): string {
  const dayLabel = SCHEDULE_DAY_LABELS[day] ?? day;
  const start = startTime.slice(0, 5);
  const end = endTime.slice(0, 5);
  return `${dayLabel} ${start}–${end}`;
}

type StatusFilter = 'ALL' | ClassStatus;

export function TeacherClassesPage() {
  const { classes, status, error, reload } = useTeacherClasses();
  const classesList = useMemo(() => classes ?? [], [classes]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const filteredClasses = useMemo(() => {
    if (statusFilter === 'ALL') return classesList;
    return classesList.filter((cls) => cls.status === statusFilter);
  }, [classesList, statusFilter]);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Lớp học"
        description="Danh sách các lớp bạn đang phụ trách."
      />

      {status === 'success' && classesList.length > 0 && (
        <div className={styles.toolbar}>
          <div className={styles.filter} role="group" aria-label="Lọc theo trạng thái">
            <Select
              aria-label="Lọc trạng thái"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="ALL">Tất cả ({classesList.length})</option>
              <option value="UPCOMING">Sắp khai giảng ({classesList.filter((c) => c.status === 'UPCOMING').length})</option>
              <option value="STUDYING">Đang học ({classesList.filter((c) => c.status === 'STUDYING').length})</option>
              <option value="FINISHED">Đã kết thúc ({classesList.filter((c) => c.status === 'FINISHED').length})</option>
              <option value="CANCELLED">Đã hủy ({classesList.filter((c) => c.status === 'CANCELLED').length})</option>
            </Select>
          </div>
        </div>
      )}

      {status === 'loading' && <TeacherClassesSkeleton />}

      {status === 'error' && (
        <ErrorState
          icon={ListChecks}
          title="Không thể tải danh sách lớp học"
          message={error ?? undefined}
          onRetry={reload}
        />
      )}

      {status === 'success' &&
        (classesList.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="Chưa được phân công lớp nào"
            description="Bạn chưa được phân công dạy lớp nào. Vui lòng liên hệ quản trị viên."
          />
        ) : filteredClasses.length === 0 ? (
          <EmptyState
            icon={Filter}
            title="Không tìm thấy lớp phù hợp"
            description="Thử thay đổi bộ lọc trạng thái."
          />
        ) : (
          <Card>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tên lớp</th>
                    <th>Khóa học</th>
                    <th>Lịch học</th>
                    <th>Phòng</th>
                    <th>Trạng thái</th>
                    <th className={styles.numberCol}>Sĩ số</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClasses.map((cls) => (
                    <tr key={cls.id}>
                      <td>
                        <span className={styles.className}>{cls.name}</span>
                      </td>
                      <td>{cls.courseName}</td>
                      <td>
                        <div className={styles.scheduleCell}>
                          <CalendarClock size={14} aria-hidden="true" className={styles.scheduleIcon} />
                          {formatSchedule(cls.scheduleDay, cls.startTime, cls.endTime)}
                        </div>
                        <div className={styles.dateRange}>
                          {formatDateTime(cls.startDate)} – {formatDateTime(cls.endDate)}
                        </div>
                      </td>
                      <td>{cls.room}</td>
                      <td>
                        <Badge tone={CLASS_STATUS_TONES[cls.status]} dot>
                          {CLASS_STATUS_LABELS[cls.status]}
                        </Badge>
                      </td>
                      <td className={styles.numberCol}>
                        {cls.currentHeadcount} / {cls.maxCapacity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
    </div>
  );
}

function TeacherClassesSkeleton() {
  return (
    <div className={styles.skeletonList} aria-label="Đang tải danh sách lớp học" role="status">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className={styles.skeletonRow} data-testid="skeleton-row">
          <span className={`${styles.skeletonLine} ${styles.skeletonLineName}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineCourse}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineSchedule}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineRoom}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineStatus}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineEnrollment}`} />
        </div>
      ))}
    </div>
  );
}