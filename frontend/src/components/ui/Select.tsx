import { forwardRef, useId, type SelectHTMLAttributes, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import styles from './Select.module.css';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, leftIcon, className, id, children, ...rest },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const describedBy = hint || error ? `${selectId}-help` : undefined;

  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={selectId}>
          {label}
        </label>
      )}
      <div className={styles.control}>
        {leftIcon && <span className={styles.icon}>{leftIcon}</span>}
        <select
          ref={ref}
          id={selectId}
          className={cn(styles.select, leftIcon && styles.hasIcon, error && styles.invalid, className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown className={styles.chevron} size={16} aria-hidden="true" />
      </div>
      {error ? (
        <p className={styles.error} id={describedBy}>
          {error}
        </p>
      ) : hint ? (
        <p className={styles.hint} id={describedBy}>
          {hint}
        </p>
      ) : null}
    </div>
  );
});
