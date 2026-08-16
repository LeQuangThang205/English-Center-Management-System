import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  comingSoon?: boolean;
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}
