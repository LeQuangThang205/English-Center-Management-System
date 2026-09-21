import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Menu, X } from 'lucide-react';
import { LANDING_NAV_ITEMS } from '@/components/landing/landingNav';
import { cn } from '@/utils/cn';
import styles from './PublicHeader.module.css';

const NAV_ITEMS = LANDING_NAV_ITEMS;

export function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand} aria-label="BrightWay English — Trang chủ">
          <span className={styles.logo} aria-hidden="true">
            <GraduationCap size={22} />
          </span>
          <span className={styles.brandText}>
            BrightWay <span className={styles.brandAccent}>English</span>
          </span>
        </Link>

        <nav
          className={styles.desktopNav}
          aria-label="Điều hướng trang chủ"
          data-testid="public-desktop-nav"
        >
          <ul className={styles.navList}>
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a className={styles.navLink} href={item.href}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.desktopActions}>
          {/* Public registration UI chưa có trong S19.1 — "Đăng ký" tạm dẫn về /login. */}
          <Link to="/login" className={cn(styles.btn, styles.btnGhost)}>
            Đăng nhập
          </Link>
          <Link to="/login" className={cn(styles.btn, styles.btnAccent)}>
            Đăng ký
          </Link>
        </div>

        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={menuOpen}
          aria-controls="public-mobile-menu"
          aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div id="public-mobile-menu" className={styles.mobileMenu}>
          <nav aria-label="Điều hướng trang chủ trên di động">
            <ul className={styles.mobileNavList}>
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a
                    className={styles.mobileNavLink}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className={styles.mobileActions}>
            <Link
              to="/login"
              className={cn(styles.btn, styles.btnGhost, styles.btnBlock)}
              onClick={() => setMenuOpen(false)}
            >
              Đăng nhập
            </Link>
            <Link
              to="/login"
              className={cn(styles.btn, styles.btnAccent, styles.btnBlock)}
              onClick={() => setMenuOpen(false)}
            >
              Đăng ký
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
