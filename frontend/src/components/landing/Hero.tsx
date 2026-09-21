import { Link } from 'react-router-dom';
import { BookOpenCheck, CalendarDays, GraduationCap, MessagesSquare } from 'lucide-react';
import { Reveal } from '@/components/landing/Reveal';
import { cn } from '@/utils/cn';
import layoutStyles from './PublicLayout.module.css';
import headerBtnStyles from './PublicHeader.module.css';
import styles from './Hero.module.css';

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <div className={cn(layoutStyles.container, styles.grid)}>
        <Reveal className={styles.copy}>
          <p className={layoutStyles.eyebrow}>BrightWay English · Học tiếng Anh hiện đại</p>
          <h1 id="hero-heading" className={styles.title}>
            Tiếng Anh hôm nay.
            <span className={styles.titleBreak}>Cơ hội lớn ngày mai.</span>
          </h1>
          <p className={styles.slogan}>“Vững tiếng Anh – Mở lối tương lai”</p>
          <p className={styles.description}>
            Lộ trình học rõ ràng, lớp học tương tác cùng giảng viên tận tâm và hệ thống theo dõi
            kết quả trực tuyến — giúp bạn tiến bộ qua từng buổi học.
          </p>
          <div className={styles.actions}>
            <Link
              to="/login"
              className={cn(headerBtnStyles.btn, headerBtnStyles.btnAccent, styles.cta)}
            >
              Học thử miễn phí
            </Link>
            <a
              href="#khoa-hoc"
              className={cn(headerBtnStyles.btn, headerBtnStyles.btnGhost, styles.cta)}
            >
              Khám phá khóa học
            </a>
          </div>
        </Reveal>

        <div className={styles.visual} aria-hidden="true">
          <div className={styles.mainCard}>
            <span className={styles.mainIcon}>
              <GraduationCap size={28} />
            </span>
            <p className={styles.mainCardTitle}>Lớp học tương tác</p>
            <p className={styles.mainCardText}>Học trực tiếp cùng giảng viên và bạn học</p>
            <div className={styles.bars}>
              <span className={styles.bar} style={{ width: '82%' }} />
              <span className={styles.bar} style={{ width: '64%' }} />
              <span className={styles.bar} style={{ width: '74%' }} />
            </div>
          </div>
          <div className={styles.floatCardTop}>
            <span className={styles.floatIcon}>
              <MessagesSquare size={18} />
            </span>
            <div>
              <p className={styles.floatTitle}>Luyện giao tiếp</p>
              <p className={styles.floatText}>Nghe – nói mỗi buổi học</p>
            </div>
          </div>
          <div className={styles.floatCardBottom}>
            <span className={styles.floatIcon}>
              <CalendarDays size={18} />
            </span>
            <div>
              <p className={styles.floatTitle}>Lịch học linh hoạt</p>
              <p className={styles.floatText}>Theo dõi trực tuyến</p>
            </div>
          </div>
          <div className={styles.badgeCard}>
            <span className={styles.floatIcon}>
              <BookOpenCheck size={18} />
            </span>
            <p className={styles.floatTitle}>Lộ trình rõ ràng</p>
          </div>
        </div>
      </div>
    </section>
  );
}
