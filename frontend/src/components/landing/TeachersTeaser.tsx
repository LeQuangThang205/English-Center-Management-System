import { LifeBuoy, MessagesSquare, UserCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Reveal } from '@/components/landing/Reveal';
import layoutStyles from './PublicLayout.module.css';
import styles from './TeachersTeaser.module.css';

// Static marketing copy about the teaching team in general terms.
// No teacher names, avatars, qualifications or experience figures here:
// the current backend exposes no public-safe teacher profile data,
// so this section intentionally does NOT call /api/users.
const HIGHLIGHTS = [
  {
    icon: UserCheck,
    title: 'Theo sát từng lớp học',
    description: 'Sĩ số lớp được quản lý chặt chẽ để giảng viên quan tâm đến từng học viên.',
  },
  {
    icon: MessagesSquare,
    title: 'Phương pháp học thực tế',
    description: 'Ưu tiên luyện nghe – nói qua tình huống giao tiếp gần gũi với đời sống.',
  },
  {
    icon: LifeBuoy,
    title: 'Hỗ trợ suốt quá trình học',
    description: 'Đồng hành từ buổi học đầu tiên đến khi bạn đạt được mục tiêu đề ra.',
  },
];

export function TeachersTeaser() {
  return (
    <section id="giang-vien" className={layoutStyles.section}>
      <div className={layoutStyles.container}>
        <Reveal className={layoutStyles.sectionHead}>
          <p className={layoutStyles.eyebrow}>Giảng viên</p>
          <h2 className={layoutStyles.sectionTitle}>
            Đồng hành cùng đội ngũ giảng viên tận tâm
          </h2>
          <p className={layoutStyles.sectionSubtitle}>
            Người dạy không chỉ truyền đạt kiến thức mà còn là người đồng hành cùng bạn trên mỗi
            chặng đường học tập.
          </p>
        </Reveal>

        <div className={styles.grid}>
          {HIGHLIGHTS.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title} delay={index * 70}>
              <Card className={styles.card}>
                <span className={styles.icon} aria-hidden="true">
                  <Icon size={22} />
                </span>
                <h3 className={styles.itemTitle}>{item.title}</h3>
                <p className={styles.itemDescription}>{item.description}</p>
              </Card>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
