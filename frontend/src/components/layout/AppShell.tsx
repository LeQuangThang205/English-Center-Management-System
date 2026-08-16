import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Role } from '@/types/user';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import styles from './AppShell.module.css';

export interface AppShellProps {
  role: Role;
  children: ReactNode;
  preview?: boolean;
}

export function AppShell({ role, children, preview = false }: AppShellProps) {
  const breakpoint = useBreakpoint();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isDrawer = breakpoint !== 'desktop';

  const closeDrawer = () => setDrawerOpen(false);
  const handleMenuClick = () => {
    if (isDrawer) {
      setDrawerOpen(true);
    } else {
      setCollapsed((value) => !value);
    }
  };

  return (
    <div className={styles.shell}>
      <Sidebar
        role={role}
        collapsed={collapsed}
        drawer={isDrawer}
        open={drawerOpen}
        onClose={closeDrawer}
        onToggleCollapse={() => setCollapsed((value) => !value)}
      />
      <div className={styles.main}>
        <Topbar role={role} onMenuClick={handleMenuClick} preview={preview} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
