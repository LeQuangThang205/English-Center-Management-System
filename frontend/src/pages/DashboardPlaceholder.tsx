import { LayoutDashboard } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Role } from '@/types/user';
import styles from './DashboardPlaceholder.module.css';

export interface DashboardPlaceholderProps {
  role: Role;
}

export function DashboardPlaceholder({ role }: DashboardPlaceholderProps) {
  const roleLabel = { ADMIN: 'Admin', TEACHER: 'Giáo viên', STUDENT: 'Học viên' }[role];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Dashboard"
        description={`Tổng quan dành cho ${roleLabel}.`}
      />
      <EmptyState
        icon={LayoutDashboard}
        title="Dashboard chưa sẵn sàng"
        description="Dashboard sẽ được triển khai ở bước tiếp theo — không hiển thị dữ liệu giả."
      />
    </div>
  );
}
