import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Spinner } from '@/components/ui/Spinner';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, leftIcon, rightIcon, className, disabled, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(styles.button, styles[variant], styles[size], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner size="sm" className={styles.spinner} /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});
