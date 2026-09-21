import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { LANDING_NAV_ITEMS } from '@/components/landing/landingNav';
import layoutStyles from './PublicLayout.module.css';
import styles from './PublicFooter.module.css';

// Footer contains NO fabricated contact details, addresses, phone numbers,
// emails or social URLs — only branding, navigation and the login CTA.
// The #lien-he anchor lives on the Location section.
const NAV_ITEMS = LANDING_NAV_ITEMS;

export function PublicFooter() {
  return (
    <footer className={styles.footer}>
      <div className={layoutStyles.container}>
        <div className={styles.grid}>
          <div className={styles.brandBlock}>
            <p className={styles.brand}>
              <span className={styles.logo} aria-hidden="true">
                <GraduationCap size={20} />
              </span>
              BrightWay English
            </p>
            <p className={styles.slogan}>Vững tiếng Anh – Mở lối tương lai</p>
          </div>

          <nav className={styles.nav} aria-label="Điều hướng chân trang">
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

          <div className={styles.ctaBlock}>
            <p className={styles.ctaText}>Đã có tài khoản học viên?</p>
            <Link to="/login" className={styles.loginLink}>
              Đăng nhập
            </Link>
          </div>
        </div>

        <p className={styles.copyright}>© 2026 BrightWay English.</p>
      </div>
    </footer>
  );
}
