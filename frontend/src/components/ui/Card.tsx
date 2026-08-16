import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  actions?: ReactNode;
}

export function Card({ title, description, actions, className, children, ...rest }: CardProps) {
  return (
    <div className={cn(styles.card, className)} {...rest}>
      {(title || actions) && (
        <div className={styles.header}>
          <div>
            {title && <h3 className={styles.title}>{title}</h3>}
            {description && <p className={styles.description}>{description}</p>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
