import { cn } from '@/utils/cn';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return <span className={cn(styles.spinner, styles[size], className)} role="status" aria-label="Đang tải" />;
}
