import { CalendarClock, Filter, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { useTeacherSchedule } from '@/features/schedule/useTeacherSchedule';
import { formatDateTime } from '@/utils/format';
import styles from './TeacherSchedulePage.module.css';

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

export function TeacherSchedulePage() {
  const { schedules, status, error, reload, from, to, setFrom, setTo } = useTeacherSchedule();
  const schedulesList = schedules ?? [];

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    reload();
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Lịch dạy"
        description="Lịch dạy của bạn trong khoảng thời gian đã chọn."
      />

      <form className={styles.toolbar} onSubmit={handleFilter}>
        <div className={styles.filterGroup}>
          <label htmlFor="fromDate" className={styles.label}>
            Từ ngày
          </label>
          <input
            id="fromDate"
            type="date"
            className={styles.dateInput}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="toDate" className={styles.label}>
            Đến ngày
          </label>
          <input
            id="toDate"
            type="date"
            className={styles.dateInput}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className={styles.filterButton}
          disabled={status === 'loading'}
        >
          <Filter size={16} aria-hidden="true" />
          <span>Lọc</span>
        </button>
      </form>

      {status === 'loading' && <TeacherScheduleSkeleton />}

      {status === 'error' && (
        <ErrorState
          icon={CalendarDays}
          title="Không thể tải lịch dạy"
          message={error ?? undefined}
          onRetry={reload}
        />
      )}

      {status === 'success' &&
        (schedulesList.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Chưa có lịch dạy"
            description="Không có lịch dạy nào trong khoảng thời gian này."
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
                    <th>Thời gian</th>
                    <th>Giáo viên</th>
                  </tr>
                </thead>
                <tbody>
                  {schedulesList.map((item) => (
                    <tr key={item.classId}>
                      <td>
                        <span className={styles.className}>{item.className}</span>
                      </td>
                      <td>{item.courseName}</td>
                      <td>
                        <div className={styles.scheduleCell}>
                          <CalendarClock size={14} aria-hidden="true" className={styles.scheduleIcon} />
                          {formatSchedule(item.scheduleDay, item.startTime, item.endTime)}
                        </div>
                      </td>
                      <td>{item.room}</td>
                      <td className={styles.dateRange}>
                        {formatDateTime(item.startDate)} – {formatDateTime(item.endDate)}
                      </td>
                      <td>
                        {item.teacherName ? (
                          <Badge tone="primary" dot>
                            {item.teacherName}
                          </Badge>
                        ) : (
                          '—'
                        )}
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

function TeacherScheduleSkeleton() {
  return (
    <div className={styles.skeletonList} aria-label="Đang tải lịch dạy" role="status">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className={styles.skeletonRow} data-testid="skeleton-row">
          <span className={`${styles.skeletonLine} ${styles.skeletonLineName}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineCourse}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineSchedule}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineRoom}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineDateRange}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineTeacher}`} />
        </div>
      ))}
    </div>
  );
}