import { CalendarClock, TrendingUp, UserPlus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatVnd } from '@/utils/format';
import type {
  ClassAttendance,
  NewStudentsByMonth,
  RevenueByMonth,
} from '@/features/dashboard/types';
import styles from './AdminCharts.module.css';

interface AdminChartsProps {
  revenueByMonth: RevenueByMonth[];
  newStudentsByMonth: NewStudentsByMonth[];
  attendanceByClass: ClassAttendance[];
}

export function AdminCharts({ revenueByMonth, newStudentsByMonth, attendanceByClass }: AdminChartsProps) {
  return (
    <div className={styles.charts}>
      <RevenueChart items={revenueByMonth} />
      <NewStudentsChart items={newStudentsByMonth} />
      <AttendanceChart items={attendanceByClass} />
    </div>
  );
}

interface VerticalBarChartProps {
  title: string;
  description: string;
  emptyTitle: string;
  icon: LucideIcon;
  items: RevenueByMonth[] | NewStudentsByMonth[];
  formatValue: (value: number) => string;
}

function VerticalBarChart({
  title,
  description,
  emptyTitle,
  icon: Icon,
  items,
  formatValue,
}: VerticalBarChartProps) {
  const maxValue = items.reduce((max, item) => Math.max(max, item.value), 0);

  return (
    <Card title={title} description={description}>
      {items.length === 0 ? (
        <EmptyState icon={Icon} title={emptyTitle} className={styles.compactEmpty} />
      ) : (
        <div className={styles.vbarChart} role="img" aria-label={title}>
          {items.map((item) => {
            const heightPct = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            return (
              <div key={item.key} className={styles.vbarCol}>
                <span className={styles.vbarValue}>{formatValue(item.value)}</span>
                <div className={styles.vbarTrack}>
                  <div className={styles.vbarFill} style={{ height: `${heightPct}%` }} />
                </div>
                <span className={styles.vbarLabel}>{item.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function RevenueChart({ items }: { items: RevenueByMonth[] }) {
  return (
    <VerticalBarChart
      title="Doanh thu theo tháng"
      description="Tổng doanh thu từ các giao dịch thành công."
      emptyTitle="Chưa có doanh thu"
      icon={TrendingUp}
      items={items}
      formatValue={formatVnd}
    />
  );
}

function NewStudentsChart({ items }: { items: NewStudentsByMonth[] }) {
  return (
    <VerticalBarChart
      title="Học viên mới theo tháng"
      description="Số học viên đăng ký theo từng tháng."
      emptyTitle="Chưa có học viên mới"
      icon={UserPlus}
      items={items}
      formatValue={(value) => String(value)}
    />
  );
}

function AttendanceChart({ items }: { items: ClassAttendance[] }) {
  return (
    <Card title="Tỷ lệ chuyên cần theo lớp" description="Tỷ lệ học viên có mặt theo từng lớp.">
      {items.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Chưa có dữ liệu điểm danh"
          className={styles.compactEmpty}
        />
      ) : (
        <ul className={styles.hbarList}>
          {items.map((item) => (
            <li key={item.classId} className={styles.hbarRow}>
              <div className={styles.hbarHead}>
                <span className={styles.hbarName}>{item.className}</span>
                <span className={styles.hbarPercent}>{item.rate}%</span>
              </div>
              <div className={styles.hbarTrack} role="img" aria-label={`${item.className}: ${item.rate}%`}>
                <div className={styles.hbarFill} style={{ width: `${item.rate}%` }} />
              </div>
              <span className={styles.hbarMeta}>
                {item.courseName} · {item.present}/{item.total} lượt có mặt
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
