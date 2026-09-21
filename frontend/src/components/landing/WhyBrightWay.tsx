import { CalendarDays, HeartHandshake, MonitorSmartphone, Route } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Reveal } from '@/components/landing/Reveal';
import { cn } from '@/utils/cn';
import layoutStyles from './PublicLayout.module.css';
import styles from './WhyBrightWay.module.css';

const VALUES = [
  {
    icon: Route,
    title: 'Lộ trình phù hợp',
    description:
      'Học theo cấp độ từ cơ bản đến nâng cao, mỗi bước đều rõ ràng và có mục tiêu cụ thể.',
  },
  {
    icon: HeartHandshake,
    title: 'Giảng viên tận tâm',
    description: 'Được theo sát trong từng buổi học, từ phát âm đến kỹ năng giao tiếp thực tế.',
  },
  {
    icon: CalendarDays,
    title: 'Lịch học linh hoạt',
    description: 'Nhiều khung giờ học trong tuần, dễ dàng sắp xếp cùng lịch học và công việc.',
  },
  {
    icon: MonitorSmartphone,
    title: 'Quản lý học tập trực tuyến',
    description: 'Theo dõi lịch học, điểm danh và kết quả học tập mọi lúc trên hệ thống.',
  },
];

export function WhyBrightWay() {
  return (
    <section id="ve-chung-toi" className={layoutStyles.section}>
      <div className={layoutStyles.container}>
        <Reveal className={layoutStyles.sectionHead}>
          <p className={layoutStyles.eyebrow}>Về chúng tôi</p>
          <h2 className={layoutStyles.sectionTitle}>Tại sao chọn BrightWay English?</h2>
          <p className={layoutStyles.sectionSubtitle}>
            Môi trường học hiện đại, phương pháp thực tế và công cụ theo dõi minh bạch — tất cả
            hướng đến sự tiến bộ của bạn.
          </p>
        </Reveal>

        <div className={cn(styles.grid)}>
          {VALUES.map((value, index) => {
            const Icon = value.icon;
            return (
              <Reveal key={value.title} delay={index * 70}>
              <Card className={styles.card}>
                <span className={styles.icon} aria-hidden="true">
                  <Icon size={22} />
                </span>
                <h3 className={styles.valueTitle}>{value.title}</h3>
                <p className={styles.valueDescription}>{value.description}</p>
              </Card>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
