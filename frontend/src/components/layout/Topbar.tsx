import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu, LogOut, ChevronDown, UserCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Role } from '@/types/user';
import { Avatar } from '@/components/ui/Avatar';
import { flattenNav } from '@/routes/navigation';
import { useAuth } from '@/features/auth/useAuth';
import styles from './Topbar.module.css';

export interface TopbarProps {
  role: Role;
  onMenuClick: () => void;
  /** Preview mode — không có user thật */
  preview?: boolean;
}

export function Topbar({ role, onMenuClick, preview = false }: TopbarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const current = flattenNav(role).find((item) => location.pathname.startsWith(item.path));

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button type="button" className={styles.menuButton} onClick={onMenuClick} aria-label="Mở menu">
          <Menu size={20} />
        </button>
        <span className={styles.context}>{current?.label ?? 'English Center'}</span>
      </div>

      <div className={styles.right}>
        <button type="button" className={styles.iconButton} aria-label="Thông báo">
          <Bell size={20} />
        </button>

        <div className={styles.userWrap} ref={menuRef}>
          <button
            type="button"
            className={cn(styles.userButton, menuOpen && styles.userButtonOpen)}
            onClick={() => setMenuOpen((value) => !value)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <Avatar name={preview ? 'Preview' : user?.fullName} src={user?.avatarUrl} size="sm" />
            {!preview && (
              <>
                <span className={styles.userInfo}>
                  <span className={styles.userName}>{user?.fullName}</span>
                  <span className={styles.userRole}>{role}</span>
                </span>
                <ChevronDown size={14} className={styles.userChevron} />
              </>
            )}
          </button>

          {menuOpen && (
            <div className={styles.dropdown} role="menu">
              <button type="button" className={styles.dropdownItem} role="menuitem">
                <UserCircle2 size={16} aria-hidden="true" />
                Hồ sơ
              </button>
              <button type="button" className={styles.dropdownItem} role="menuitem" onClick={handleLogout}>
                <LogOut size={16} aria-hidden="true" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
