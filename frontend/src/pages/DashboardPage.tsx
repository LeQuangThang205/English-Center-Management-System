import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  School,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { SCHEDULE_DAY_LABELS } from '@/features/dashboard/dashboardData';
import type { DashboardStat } from '@/features/dashboard/types';
import type {
  AdminDashboardData,
  DashboardData,
  StudentDashboardData,
  TeacherDashboardData,
} from '@/features/dashboard/types';
import { useDashboardData } from '@/features/dashboard/useDashboardData';
import { useAuth } from '@/features/auth/useAuth';
import { formatDate, formatVnd } from '@/utils/format';
import type { Registration } from '@/types/registration';
import type { Schedule } from '@/types/schedule';
import type { Transaction } from '@/types/transaction';
import type { Role } from '@/types/user';
import styles from './DashboardPage.module.css';

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  ADMIN: 'Tổng quan hoạt động của trung tâm.',
  TEACHER: 'Tổng quan lớp học và lịch dạy của bạn.',
  STUDENT: 'Tổng quan khóa học và lịch học của bạn.',
};

const REGISTRATION_STATUS_LABELS: Record<Registration['status'], string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
  PAID: 'Đã thanh toán',
};

const STAT_ICONS: Record<string, LucideIcon> = {
  students: Users,
  teachers: UserCog,
  courses: BookOpen,
  classes: School,
  totalClasses: School,
  weeklySessions: CalendarDays,
  myCourses: BookOpen,
  pendingRegistrations: ClipboardList,
  notifications: Bell,
};

export function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  return <DashboardView role={user.role} userId={user.id} />;
}

function DashboardView({ role, userId }: { role: Role; userId: number }) {
  const { status, stats, data, reload } = useDashboardData(role, userId);

  return (
    <div className={styles.page}>
      <PageHeader title="Dashboard" description={ROLE_DESCRIPTIONS[role]} />
      {status === 'loading' && <DashboardSkeleton />}
      {status === 'error' && (
        <ErrorState
          icon={LayoutDashboard}
          title="Không thể tải dữ liệu dashboard"
          message="Vui lòng kiểm tra kết nối và thử lại."
          onRetry={reload}
        />
      )}
      {status === 'success' && data && <DashboardContent role={role} stats={stats} data={data} />}
    </div>
  );
}

function DashboardContent({
  role,
  stats,
  data,
}: {
  role: Role;
  stats: DashboardStat[];
  data: DashboardData;
}) {
  if (role === 'ADMIN') return <AdminDashboard stats={stats} data={data as AdminDashboardData} />;
  if (role === 'TEACHER')
    return <TeacherDashboard stats={stats} data={data as TeacherDashboardData} />;
  return <StudentDashboard stats={stats} data={data as StudentDashboardData} />;
}

function AdminDashboard({ stats, data }: { stats: DashboardStat[]; data: AdminDashboardData }) {
  return (
    <>
      <StatGrid stats={stats} />
      <div className={styles.sections}>
        <PendingRegistrationsSection items={data.pendingRegistrations} />
        <PendingTransactionsSection items={data.pendingTransactions} />
      </div>
    </>
  );
}

function TeacherDashboard({ stats, data }: { stats: DashboardStat[]; data: TeacherDashboardData }) {
  return (
    <>
      <StatGrid stats={stats} />
      <div className={styles.sections}>
        <ScheduleSection title="Lịch dạy tuần này" items={data.weeklySessions} />
      </div>
    </>
  );
}

function StudentDashboard({ stats, data }: { stats: DashboardStat[]; data: StudentDashboardData }) {
  return (
    <>
      <StatGrid stats={stats} />
      <div className={styles.sections}>
        <ScheduleSection title="Lịch học tuần này" items={data.weeklySessions} />
        <PendingRegistrationsSection items={data.pendingRegistrations} />
      </div>
    </>
  );
}

function StatGrid({ stats }: { stats: DashboardStat[] }) {
  return (
    <div className={styles.statsGrid}>
      {stats.map((stat) => {
        const Icon = STAT_ICONS[stat.key] ?? LayoutDashboard;
        return (
          <div key={stat.key} className={styles.statCard}>
            <span className={styles.statIcon}>
              <Icon size={20} aria-hidden="true" />
            </span>
            <div className={styles.statBody}>
              <p className={styles.statValue}>{stat.value}</p>
              <p className={styles.statLabel}>{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScheduleSection({ title, items }: { title: string; items: Schedule[] }) {
  return (
    <Card title={title} description="Các buổi học trong tuần này.">
      {items.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Không có buổi học trong tuần này"
          className={styles.compactEmpty}
        />
      ) : (
        <ul className={styles.list}>
          {items.map((session) => (
            <li key={session.classId} className={styles.row}>
              <div className={styles.rowMain}>
                <p className={styles.rowTitle}>{session.className}</p>
                <p className={styles.rowSub}>
                  {SCHEDULE_DAY_LABELS[session.scheduleDay]} · {session.startTime}–{session.endTime} ·
                  Phòng {session.room}
                </p>
              </div>
              <Badge>{session.courseName}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function PendingRegistrationsSection({ items }: { items: Registration[] }) {
  return (
    <Card title="Đăng ký chờ duyệt" description="Các đăng ký mới cần được xử lý.">
      {items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Chưa có đăng ký chờ duyệt"
          className={styles.compactEmpty}
        />
      ) : (
        <ul className={styles.list}>
          {items.map((registration) => (
            <li key={registration.id} className={styles.row}>
              <div className={styles.rowMain}>
                <p className={styles.rowTitle}>{registration.studentName}</p>
                <p className={styles.rowSub}>
                  {registration.className} · {formatDate(registration.registeredAt)}
                </p>
              </div>
              <Badge tone="warning">{REGISTRATION_STATUS_LABELS[registration.status]}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function PendingTransactionsSection({ items }: { items: Transaction[] }) {
  return (
    <Card title="Thanh toán chờ xác nhận" description="Giao dịch đang chờ được xác nhận.">
      {items.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Không có giao dịch chờ xác nhận"
          className={styles.compactEmpty}
        />
      ) : (
        <ul className={styles.list}>
          {items.map((transaction) => (
            <li key={transaction.id} className={styles.row}>
              <div className={styles.rowMain}>
                <p className={styles.rowTitle}>{transaction.studentName}</p>
                <p className={styles.rowSub}>
                  {transaction.transactionCode} · {formatDate(transaction.createdAt)}
                </p>
              </div>
              <p className={styles.rowValue}>{formatVnd(transaction.amount)}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className={styles.skeletonWrap} aria-label="Đang tải dữ liệu dashboard" role="status">
      <div className={styles.statsGrid}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={styles.statCard}>
            <span className={styles.skeletonIcon} />
            <div className={styles.skeletonLines}>
              <div className={styles.skeletonValue} />
              <div className={styles.skeletonLabel} />
            </div>
          </div>
        ))}
      </div>
      <div className={styles.skeletonSection} />
    </div>
  );
}