import { Outlet } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import type { Role } from '@/types/user';

export interface AppLayoutProps {
  role: Role;
  preview?: boolean;
}

export function AppLayout({ role, preview = false }: AppLayoutProps) {
  return (
    <AppShell role={role} preview={preview}>
      <Outlet />
    </AppShell>
  );
}
