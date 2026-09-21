import { cn } from '@/utils/cn';
import { Reveal } from '@/components/landing/Reveal';
import layoutStyles from './PublicLayout.module.css';
import styles from './LearningJourney.module.css';

// Mirrors the real product workflow: discover courses, register for a class
// after login, attend sessions, then track results online.
// No invented features (streaks, certificates, placement tests).
const STEPS = [
  {
    title: 'Khám phá khóa học',
    description: 'Tìm hiểu các khóa học và chọn hướng học phù hợp với mục tiêu của bạn.',
  },
  {
    title: 'Đăng ký lớp',
    description: 'Đăng nhập và đăng ký lớp học phù hợp tại trang Đăng ký của học viên.',
  },
  {
    title: 'Tham gia học tập',
    description: 'Học trực tiếp cùng giảng viên theo lịch lớp và luyện tập mỗi buổi.',
  },
  {
    title: 'Theo dõi kết quả',
    description: 'Xem lịch học, điểm danh và bảng điểm của mình trực tuyến, minh bạch.',
  },
];

export function LearningJourney() {
  return (
    <section className={cn(layoutStyles.section, layoutStyles.sectionAlt)}>
      <div className={layoutStyles.container}>
        <Reveal className={layoutStyles.sectionHead}>
          <p className={layoutStyles.eyebrow}>Hành trình học tập</p>
          <h2 className={layoutStyles.sectionTitle}>Bốn bước đơn giản để bắt đầu</h2>
          <p className={layoutStyles.sectionSubtitle}>
            Từ lúc tìm hiểu khóa học đến khi nhìn thấy kết quả — mọi thứ đều rõ ràng.
          </p>
        </Reveal>

        <ol className={styles.steps}>
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <Reveal delay={index * 70} className={styles.step}>
                <span className={styles.stepNumber} aria-hidden="true">
                  {index + 1}
                </span>
                <div className={styles.stepBody}>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDescription}>{step.description}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
