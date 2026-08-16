import { NavLink } from 'react-router-dom';
import { GraduationCap, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Role } from '@/types/user';
import { navConfig } from '@/routes/navigation';
import styles from './Sidebar.module.css';

export interface SidebarProps {
  role: Role;
  collapsed: boolean;
  /** true khi hiển thị dạng drawer (mobile/tablet) */
  drawer: boolean;
  open: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

export function Sidebar({ role, collapsed, drawer, open, onClose, onToggleCollapse }: SidebarProps) {
  return (
    <>
      {drawer && open && (
        <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
      )}
      <aside
        className={cn(
          styles.sidebar,
          collapsed && styles.collapsed,
          drawer && styles.drawer,
          drawer && open && styles.drawerOpen,
        )}
        aria-label="Điều hướng chính"
      >
        <div className={styles.brand}>
          <span className={styles.logo}>
            <GraduationCap size={20} aria-hidden="true" />
          </span>
          {!collapsed && <span className={styles.brandText}>English Center</span>}
          {drawer && (
            <button type="button" className={styles.close} onClick={onClose} aria-label="Đóng menu">
              <X size={18} />
            </button>
          )}
        </div>

        <nav className={styles.nav}>
          {navConfig[role].map((group, index) => (
            <div key={group.title ?? `group-${index}`} className={styles.group}>
              {group.title && !collapsed && <p className={styles.groupLabel}>{group.title}</p>}
              {group.title && collapsed && <div className={styles.groupDivider} />}
              <ul className={styles.list}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          cn(styles.item, isActive && !item.comingSoon && styles.itemActive)
                        }
                        onClick={drawer ? onClose : undefined}
                        title={collapsed ? item.label : undefined}
                        aria-disabled={item.comingSoon}
                        tabIndex={item.comingSoon ? -1 : 0}
                      >
                        <Icon size={20} className={styles.itemIcon} aria-hidden="true" />
                        {!collapsed && (
                          <span className={styles.itemLabel}>
                            {item.label}
                            {item.comingSoon && (
                              <span className={styles.comingSoon}>Sắp tới</span>
                            )}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className={styles.footer}>
          {!drawer && (
            <button
              type="button"
              className={styles.collapseButton}
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            >
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              {!collapsed && <span>Thu gọn</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
