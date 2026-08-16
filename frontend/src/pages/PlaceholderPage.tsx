import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import type { NavItem } from '@/types/nav';
import styles from './PlaceholderPage.module.css';

export interface PlaceholderPageProps {
  item: NavItem;
}

export function PlaceholderPage({ item }: PlaceholderPageProps) {
  const Icon = item.icon;
  return (
    <div className={styles.page}>
      <PageHeader
        title={item.label}
        description="Chức năng sẽ được triển khai ở các bước tiếp theo."
      />
      <EmptyState
        icon={Icon}
        title={`${item.label} chưa sẵn sàng`}
        description="Trang này là placeholder của routing foundation — chưa có dữ liệu hay chức năng nghiệp vụ."
      />
    </div>
  );
}
