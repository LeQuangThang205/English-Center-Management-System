import type { ReactNode } from 'react';
import { PublicHeader } from '@/components/landing/PublicHeader';
import { PublicFooter } from '@/components/landing/PublicFooter';
import styles from './PublicLayout.module.css';

export interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div id="top" className={styles.page}>
      <PublicHeader />
      <main className={styles.main}>{children}</main>
      <PublicFooter />
    </div>
  );
}
