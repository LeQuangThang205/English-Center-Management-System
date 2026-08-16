import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import styles from './Input.module.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leftIcon, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = hint || error ? `${inputId}-help` : undefined;

  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className={styles.control}>
        {leftIcon && <span className={styles.icon}>{leftIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          className={cn(styles.input, leftIcon && styles.hasIcon, error && styles.invalid, className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
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
