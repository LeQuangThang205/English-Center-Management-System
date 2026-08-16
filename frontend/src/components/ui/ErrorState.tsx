import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import styles from './ErrorState.module.css';

export interface ErrorStateProps {
  icon?: LucideIcon;
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  icon: Icon,
  title = 'Không thể tải dữ liệu',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className={styles.error}>
      {Icon && (
        <span className={styles.iconWrap}>
          <Icon size={24} aria-hidden="true" />
        </span>
      )}
      <h3 className={styles.title}>{title}</h3>
      {message && <p className={styles.message}>{message}</p>}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className={styles.retry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}
