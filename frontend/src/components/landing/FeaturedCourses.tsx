import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Languages, PenLine } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Reveal } from '@/components/landing/Reveal';
import { COURSE_LEVEL_LABELS } from '@/features/courses/courseValidation';
import { cn } from '@/utils/cn';
import layoutStyles from './PublicLayout.module.css';
import styles from './FeaturedCourses.module.css';

// Static marketing/demo content for the public landing page.
// Public course API is not available in the current backend
// (GET /api/courses requires JWT), so this section intentionally
// does NOT call coursesApi and does NOT present itself as live data.
// Course names/levels below mirror the backend seed data so the
// marketing page stays consistent with the real product.
const DEMO_COURSES = [
  {
    name: 'English Foundation',
    level: 'BEGINNER' as const,
    icon: BookOpen,
    description:
      'Xây nền tảng vững chắc: phát âm, từ vựng và ngữ pháp cơ bản dành cho người mới bắt đầu.',
  },
  {
    name: 'English Communication',
    level: 'INTERMEDIATE' as const,
    icon: Languages,
    description:
      'Tự tin giao tiếp: luyện nghe – nói qua các tình huống thực tế trong học tập và công việc.',
  },
  {
    name: 'IELTS Advanced',
    level: 'ADVANCED' as const,
    icon: PenLine,
    description:
      'Chinh phục mục tiêu IELTS với lộ trình luyện tập chuyên sâu cả bốn kỹ năng.',
  },
];

export function FeaturedCourses() {
  return (
    <section id="khoa-hoc" className={cn(layoutStyles.section, layoutStyles.sectionAlt)}>
      <div className={layoutStyles.container}>
        <Reveal className={layoutStyles.sectionHead}>
          <p className={layoutStyles.eyebrow}>Khóa học</p>
          <h2 className={layoutStyles.sectionTitle}>Khóa học phù hợp với mục tiêu của bạn</h2>
          <p className={layoutStyles.sectionSubtitle}>
            Ba hướng học chính tại BrightWay English — từ nền tảng cơ bản đến giao tiếp và luyện
            thi chuyên sâu.
          </p>
        </Reveal>

        <div className={styles.grid}>
          {DEMO_COURSES.map((course, index) => {
            const Icon = course.icon;
            return (
              <Reveal key={course.name} delay={index * 70}>
              <Card className={styles.card}>
                <span className={styles.icon} aria-hidden="true">
                  <Icon size={22} />
                </span>
                <h3 className={styles.courseName}>{course.name}</h3>
                <div className={styles.levelRow}>
                  <Badge tone="primary" dot>
                    {COURSE_LEVEL_LABELS[course.level]}
                  </Badge>
                </div>
                <p className={styles.courseDescription}>{course.description}</p>
                <Link to="/login" className={styles.cardCta}>
                  Đăng nhập để xem chi tiết
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </Card>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
