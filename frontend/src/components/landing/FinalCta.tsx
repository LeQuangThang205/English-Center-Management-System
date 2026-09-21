import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import layoutStyles from './PublicLayout.module.css';
import headerBtnStyles from './PublicHeader.module.css';
import styles from './FinalCta.module.css';

export function FinalCta() {
  return (
    <section className={layoutStyles.section}>
      <div className={layoutStyles.container}>
        <div className={styles.banner}>
          <h2 className={styles.title}>Sẵn sàng chinh phục tiếng Anh?</h2>
          <p className={styles.subtitle}>Vững tiếng Anh – Mở lối tương lai cùng BrightWay English.</p>
          <div className={styles.actions}>
            <Link to="/login" className={cn(headerBtnStyles.btn, styles.ctaAccent)}>
              Học thử miễn phí
            </Link>
            <a href="#khoa-hoc" className={cn(headerBtnStyles.btn, styles.ctaOutline)}>
              Khám phá khóa học
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
